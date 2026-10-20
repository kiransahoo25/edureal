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
  profiles: {
    full_name: string;
  };
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

    if (slot.booked_count >= slot.capacity) {
      setMessage("Error: This slot is already full.");
      setBooking(null);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Direct Booking (No Payment Gateway)
    const { data: insertedBooking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        student_id: user.id,
        teacher_id: teacherId,
        availability_id: slot.id,
        status: "pending",
        amount: teacher?.hourly_fee || 0,
      })
      .select()
      .single();

    if (bookingError || !insertedBooking) {
      setMessage(
        `Error: ${bookingError?.message || "Could not create booking"}`,
      );
      setBooking(null);
      return;
    }

    await supabase
      .from("availability")
      .update({ booked_count: slot.booked_count + 1 })
      .eq("id", slot.id);
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slot.id ? { ...s, booked_count: s.booked_count + 1 } : s,
      ),
    );

    fetch("/api/notify-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: insertedBooking.id, type: "new" }),
    }).catch((err) => console.error("Notify failed:", err));

    setMessage("Booking request sent! Check your email. 🎉");
    setBooking(null);
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-600">
        Loading teacher profile...
      </div>
    );
  if (!teacher)
    return (
      <div className="p-8 text-center text-red-500">Teacher not found.</div>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/teachers"
          className="text-blue-600 hover:underline mb-6 inline-block font-semibold"
        >
          ← Back to Teachers
        </Link>

        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-4xl shadow-xl flex-shrink-0">
              {teacher.profiles?.full_name?.charAt(0) || "T"}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold text-gray-900 mb-1">
                {teacher.profiles?.full_name}
              </h1>
              <p className="text-lg text-blue-600 font-medium mb-2">
                {teacher.qualification}
              </p>

              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                <span className="bg-gray-100 px-3 py-1 rounded-full font-medium">
                  📍 {teacher.area}, {teacher.city}
                </span>
                <span className="bg-gray-100 px-3 py-1 rounded-full font-medium">
                  🎓 {teacher.experience_years} years experience
                </span>
                <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full">
                  ₹{teacher.hourly_fee}/hr
                </span>
                {averageRating && (
                  <span className="bg-yellow-100 text-yellow-700 font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    ⭐ {averageRating} ({reviews.length} reviews)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 mb-6">
            <h3 className="font-bold text-gray-900 mb-2">About the Teacher</h3>
            <p className="text-gray-700 leading-relaxed">{teacher.bio}</p>
            {teacher.subjects && teacher.subjects.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {teacher.subjects.map((sub) => (
                  <span
                    key={sub}
                    className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            )}
          </div>

          {teacher.demo_video_url && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                🎥 Watch a Demo Session
              </h3>
              <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-xl border-4 border-gray-900">
                {renderVideo()}
              </div>
            </div>
          )}
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl mb-6 text-sm font-bold ${message.includes("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-extrabold mb-6 text-gray-900">
              Available Time Slots
            </h2>
            {slots.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No upcoming slots yet.
              </p>
            ) : (
              <div className="space-y-4">
                {slots.map((slot) => {
                  const isFull = slot.booked_count >= slot.capacity;
                  return (
                    <div
                      key={slot.id}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-200"
                    >
                      <div>
                        <p className="font-bold text-gray-900">
                          📅{" "}
                          {new Date(slot.date).toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                        <p className="text-gray-600 font-medium text-sm">
                          🕐 {slot.start_time.slice(0, 5)} -{" "}
                          {slot.end_time.slice(0, 5)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleBook(slot)}
                        disabled={isFull || booking === slot.id}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition shadow-sm ${
                          isFull
                            ? "bg-gray-300 text-gray-500"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
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

          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-extrabold mb-6 text-gray-900">
              Student Reviews
            </h2>
            {reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No reviews yet. Be the first to book and review!
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                  >
                    <div className="flex text-yellow-500 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{i < rev.rating ? "⭐" : "☆"}</span>
                      ))}
                    </div>
                    {rev.comment && (
                      <p className="text-gray-700 text-sm mb-2">
                        {rev.comment}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
