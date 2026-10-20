"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const supabase = createClient();

type Teacher = {
  id: string;
  bio: string;
  qualification: string;
  experience_years: number;
  hourly_fee: number;
  area: string;
  city: string;
  user_id: string;
  demo_video_url: string | null;
  subjects: string[];
  profiles: { full_name: string };
};
type Slot = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
};
type Review = {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
};

export default function TeacherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  // NEW: Mode State
  const [studyMode, setStudyMode] = useState<"physical" | "virtual">(
    "physical",
  );

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setRole(profile?.role || "student");

      const { data: teacherData } = await supabase
        .from("teacher_profiles")
        .select("*, profiles (full_name)")
        .eq("id", teacherId)
        .single();
      if (!teacherData) {
        setMessage("Teacher not found.");
        setLoading(false);
        return;
      }
      setTeacher(teacherData as unknown as Teacher);

      const today = new Date().toISOString().split("T")[0];
      const { data: slotsData } = await supabase
        .from("availability")
        .select("*")
        .eq("teacher_id", teacherId)
        .gte("date", today)
        .order("date", { ascending: true });
      if (slotsData) setSlots(slotsData);

      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false });
      if (reviewsData) setReviews(reviewsData as Review[]);

      setLoading(false);
    };
    init();
  }, [teacherId, router]);

  const handleBook = async (slot: Slot) => {
    setBooking(slot.id);
    setMessage(null);

    if (role === "teacher") {
      setMessage("Error: Teachers cannot book other teachers.");
      setBooking(null);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Call our secure DB function with studyMode
    const { data: newBookingId, error: rpcError } = await supabase.rpc(
      "create_booking_v2",
      {
        p_student_id: user.id,
        p_teacher_id: teacherId,
        p_availability_id: slot.id,
        p_amount: teacher?.hourly_fee || 0,
      },
    );

    // Note: We update the mode immediately after creation
    // (In a production app, you could pass the mode into the RPC function)
    if (rpcError) {
      setMessage(`Error: ${rpcError.message}`);
      setBooking(null);
      return;
    }

    // Update the mode of the newly created booking
    await supabase
      .from("bookings")
      .update({ mode: studyMode })
      .eq("id", newBookingId);

    setSlots((prev) =>
      prev.map((s) =>
        s.id === slot.id ? { ...s, booked_count: s.booked_count + 1 } : s,
      ),
    );

    fetch("/api/notify-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: newBookingId, type: "new" }),
    }).catch((err) => console.error("Notify failed:", err));

    setMessage(
      `Booking request sent for ${studyMode === "physical" ? "Physical" : "Virtual"} class! Check your email. 🎉`,
    );
    setBooking(null);
  };

  if (loading)
    return (
      <div className="text-center text-slate-400 p-8">
        Loading teacher profile...
      </div>
    );
  if (!teacher)
    return (
      <div className="text-center text-red-400 p-8">Teacher not found.</div>
    );

  const renderVideo = () => {
    if (!teacher.demo_video_url) return null;
    const isYoutube =
      teacher.demo_video_url.includes("youtube.com") ||
      teacher.demo_video_url.includes("youtu.be");
    if (isYoutube) {
      const videoId =
        teacher.demo_video_url.split("v=")[1]?.split("&")[0] ||
        teacher.demo_video_url.split("youtu.be/")[1];
      return (
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="Demo"
          allowFullScreen
        ></iframe>
      );
    }
    return (
      <video controls className="w-full h-full object-cover">
        <source src={teacher.demo_video_url} type="video/mp4" />
      </video>
    );
  };

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length
        ).toFixed(1)
      : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <Link
        href="/teachers"
        className="text-blue-400 hover:text-blue-300 mb-6 inline-block font-semibold transition-colors"
      >
        ← Back to Teachers
      </Link>

      <div className="glass-panel p-8 mb-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center mb-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-4xl shadow-lg border border-white/20 flex-shrink-0">
            {teacher.profiles?.full_name?.charAt(0) || "T"}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold text-white mb-1">
              {teacher.profiles?.full_name}
            </h1>
            <p className="text-lg text-blue-400 font-medium mb-2">
              {teacher.qualification}
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="bg-white/10 px-3 py-1 rounded-full border border-white/10">
                📍 {teacher.area}, {teacher.city}
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-full border border-white/10">
                🎓 {teacher.experience_years} years experience
              </span>
              <span className="bg-green-500/20 text-green-300 font-bold px-3 py-1 rounded-full border border-green-500/20">
                ₹{teacher.hourly_fee}/hr
              </span>
              {averageRating && (
                <span className="bg-yellow-500/20 text-yellow-300 font-bold px-3 py-1 rounded-full border border-yellow-500/20 flex items-center gap-1">
                  ⭐ {averageRating} ({reviews.length})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-black/20 rounded-2xl p-5 border border-white/10 mb-6 shadow-inner relative z-10">
          <h3 className="font-bold text-white mb-2">About the Teacher</h3>
          <p className="text-slate-300 leading-relaxed">{teacher.bio}</p>
          {teacher.subjects && teacher.subjects.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {teacher.subjects.map((sub) => (
                <span
                  key={sub}
                  className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full font-bold"
                >
                  {sub}
                </span>
              ))}
            </div>
          )}
        </div>

        {teacher.demo_video_url && (
          <div className="relative z-10">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              🎥 Watch a Demo Session
            </h3>
            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/20">
              {renderVideo()}
            </div>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl mb-6 text-sm font-bold shadow-lg ${message.includes("Error") ? "bg-red-500/20 text-red-200 border border-red-500/30" : "bg-green-500/20 text-green-200 border border-green-500/30"}`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-8 spatial-card">
          <h2 className="text-2xl font-extrabold mb-6 text-white">
            Available Slots
          </h2>

          {/* Study Mode Toggle */}
          <div className="mb-6 bg-black/20 p-1.5 rounded-xl flex border border-white/10">
            <button
              onClick={() => setStudyMode("physical")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${studyMode === "physical" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
            >
              🏫 Physical (In-Person)
            </button>
            <button
              onClick={() => setStudyMode("virtual")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${studyMode === "virtual" ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
            >
              💻 Virtual (Online)
            </button>
          </div>

          {slots.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              No upcoming slots yet.
            </p>
          ) : (
            <div className="space-y-4">
              {slots.map((slot) => {
                const isFull = slot.booked_count >= slot.capacity;
                return (
                  <div
                    key={slot.id}
                    className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition"
                  >
                    <div>
                      <p className="font-bold text-white">
                        📅{" "}
                        {new Date(slot.date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      <p className="text-slate-400 font-medium text-sm">
                        🕐 {slot.start_time.slice(0, 5)} -{" "}
                        {slot.end_time.slice(0, 5)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleBook(slot)}
                      disabled={isFull || booking === slot.id}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition shadow-sm ${isFull ? "bg-white/5 text-slate-500" : studyMode === "physical" ? "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]"}`}
                    >
                      {booking === slot.id
                        ? "Booking..."
                        : isFull
                          ? "Full"
                          : "Book Now"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass-panel p-8 spatial-card">
          <h2 className="text-2xl font-extrabold mb-6 text-white">Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 bg-white/5 rounded-2xl border border-white/10"
                >
                  <div className="flex text-yellow-400 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>{i < rev.rating ? "⭐" : "☆"}</span>
                    ))}
                  </div>
                  {rev.comment && (
                    <p className="text-slate-300 text-sm mb-2">{rev.comment}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    {new Date(rev.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
