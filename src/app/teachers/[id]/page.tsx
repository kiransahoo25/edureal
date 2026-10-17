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

export default function TeacherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
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
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (slotsData) setSlots(slotsData);
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

  // Helper to render YouTube or standard video
  const renderVideo = () => {
    if (!teacher.demo_video_url) return null;

    const isYoutube =
      teacher.demo_video_url.includes("youtube.com") ||
      teacher.demo_video_url.includes("youtu.be");

    if (isYoutube) {
      // Extract video ID for embedding
      const videoId =
        teacher.demo_video_url.split("v=")[1]?.split("&")[0] ||
        teacher.demo_video_url.split("youtu.be/")[1];
      return (
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="Teacher Demo Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      );
    }

    return (
      <video controls className="w-full h-full object-cover">
        <source src={teacher.demo_video_url} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/teachers"
          className="text-blue-600 hover:underline mb-6 inline-block font-semibold"
        >
          ← Back to Teachers
        </Link>

        {/* Teacher Header */}
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-4xl shadow-xl">
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
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 mb-6">
            <h3 className="font-bold text-gray-900 mb-2">About the Teacher</h3>
            <p className="text-gray-700 leading-relaxed">{teacher.bio}</p>
          </div>

          {/* DEMO VIDEO SECTION */}
          {teacher.demo_video_url && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                🎥 Watch a Demo Session
              </h3>
              <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-xl border-4 border-gray-900">
                {renderVideo()}
              </div>
              <p className="text-sm text-gray-500 mt-2 text-center">
                See their teaching style before you book!
              </p>
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

        {/* Availability */}
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-extrabold mb-6 text-gray-900">
            Available Time Slots
          </h2>

          {slots.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              This teacher hasn&apos;t added any upcoming slots yet.
            </p>
          ) : (
            <div className="space-y-4">
              {slots.map((slot) => {
                const isFull = slot.booked_count >= slot.capacity;
                return (
                  <div
                    key={slot.id}
                    className="flex justify-between items-center p-5 bg-gray-50 rounded-2xl border border-gray-200 hover:border-blue-300 transition"
                  >
                    <div>
                      <p className="font-bold text-gray-900 text-lg">
                        📅{" "}
                        {new Date(slot.date).toLocaleDateString("en-IN", {
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      <p className="text-gray-600 font-medium">
                        🕐 {slot.start_time.slice(0, 5)} -{" "}
                        {slot.end_time.slice(0, 5)}
                        <span className="ml-3 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                          {slot.capacity - slot.booked_count} seat
                          {slot.capacity - slot.booked_count !== 1 ? "s" : ""}{" "}
                          left
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleBook(slot)}
                      disabled={isFull || booking === slot.id}
                      className={`px-6 py-3 rounded-xl font-bold transition shadow-sm ${
                        isFull
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md"
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
      </div>
    </div>
  );
}
