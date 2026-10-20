"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const supabase = createClient();

type Booking = {
  id: string;
  status: string;
  amount: number;
  created_at: string;
  availability: { date: string; start_time: string; end_time: string } | null;
  teacher_profiles: {
    id: string;
    user_id: string;
    area: string;
    city: string;
    profiles: { full_name: string } | null;
  } | null;
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("student");
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const [reviewingBooking, setReviewingBooking] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
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
      const userRole = profile?.role || "student";
      setRole(userRole);

      if (userRole === "student") {
        const { data } = await supabase
          .from("bookings")
          .select(
            `*, availability (date, start_time, end_time), teacher_profiles (id, user_id, area, city, profiles (full_name))`,
          )
          .eq("student_id", user.id)
          .order("created_at", { ascending: false });
        if (data) setBookings(data as unknown as Booking[]);
      } else if (userRole === "teacher") {
        const { data: teacherProfile } = await supabase
          .from("teacher_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();
        if (teacherProfile) {
          const { data } = await supabase
            .from("bookings")
            .select(
              `*, availability (date, start_time, end_time), teacher_profiles (id, user_id, area, city, profiles (full_name))`,
            )
            .eq("teacher_id", teacherProfile.id)
            .order("created_at", { ascending: false });
          if (data) setBookings(data as unknown as Booking[]);
        }
      }
      setLoading(false);
    };
    fetchBookings();
  }, [router]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);
    if (!error) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelled" } : b,
        ),
      );
      setMessage("Booking cancelled.");
    }
  };

  const handleConfirm = async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId);
    if (!error) {
      fetch("/api/notify-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, type: "confirmed" }),
      }).catch((err) => console.error(err));
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "confirmed" } : b,
        ),
      );
      setMessage("Booking confirmed! Student has been emailed. 🎉");
    }
  };

  const handleComplete = async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "completed" })
      .eq("id", bookingId);
    if (!error) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "completed" } : b,
        ),
      );
      setMessage("Booking completed.");
    }
  };

  const submitReview = async (booking: Booking) => {
    setSubmittingReview(true);
    const { error } = await supabase
      .from("reviews")
      .insert({
        booking_id: booking.id,
        teacher_id: booking.teacher_profiles?.id,
        rating,
        comment,
      });
    if (error) setMessage(`Error: ${error.message}`);
    else {
      setMessage("Review submitted! ⭐");
      setReviewingBooking(null);
      setComment("");
      setRating(5);
    }
    setSubmittingReview(false);
  };

  // --- Helper Functions for Calendar & Maps ---

  const generateCalendarLink = (booking: Booking) => {
    if (!booking.availability?.date || !booking.availability?.start_time)
      return "#";

    const dateStr = booking.availability.date.replace(/-/g, "");
    const startTimeStr = booking.availability.start_time
      .replace(/:/g, "")
      .slice(0, 6);
    const endTimeStr = booking.availability.end_time
      .replace(/:/g, "")
      .slice(0, 6);

    const start = `${dateStr}T${startTimeStr}`;
    const end = `${dateStr}T${endTimeStr}`;

    const title = encodeURIComponent(
      `EduReal Class with ${booking.teacher_profiles?.profiles?.full_name || "Teacher"}`,
    );
    const location = encodeURIComponent(
      `${booking.teacher_profiles?.area || ""} ${booking.teacher_profiles?.city || ""}`.trim(),
    );
    const details = encodeURIComponent(
      `Your EduReal session. Amount: ₹${booking.amount}`,
    );

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
  };

  const generateMapsLink = (booking: Booking) => {
    const location =
      `${booking.teacher_profiles?.area || ""} ${booking.teacher_profiles?.city || ""}`.trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/20 text-green-300 border border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-300 border border-red-500/30";
      case "completed":
        return "bg-blue-500/20 text-blue-300 border border-blue-500/30";
      default:
        return "bg-white/10 text-white border border-white/20";
    }
  };

  if (loading)
    return (
      <div className="text-center text-slate-400 p-8">
        Loading your bookings...
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-white">My Bookings</h1>
        <Link
          href="/dashboard"
          className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl mb-6 text-sm font-bold ${message.includes("Error") ? "bg-red-500/20 text-red-200 border border-red-500/30" : "bg-green-500/20 text-green-200 border border-green-500/30"}`}
        >
          {message}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <p className="text-slate-400 mb-4 text-lg">
            You have no bookings yet.
          </p>
          {role === "student" && (
            <Link
              href="/teachers"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-500 transition font-semibold shadow-[0_0_15px_rgba(37,99,235,0.4)]"
            >
              Find a Teacher
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="glass-panel p-6 spatial-card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-white">
                    {role === "student"
                      ? `👨‍🏫 ${booking.teacher_profiles?.profiles?.full_name || "Teacher"}`
                      : `🎓 Booking by Student`}
                  </h3>
                  {role === "student" && booking.teacher_profiles?.area && (
                    <p className="text-sm text-slate-400">
                      📍 {booking.teacher_profiles.area},{" "}
                      {booking.teacher_profiles.city}
                    </p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(booking.status)}`}
                >
                  {booking.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-slate-300 bg-black/20 p-4 rounded-xl mb-4 border border-white/5 shadow-inner">
                <div>
                  <p className="text-slate-500 text-xs uppercase font-bold mb-1">
                    Date
                  </p>
                  <p className="font-semibold text-white">
                    📅{" "}
                    {booking.availability?.date
                      ? new Date(booking.availability.date).toLocaleDateString(
                          "en-IN",
                          { weekday: "short", day: "numeric", month: "short" },
                        )
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase font-bold mb-1">
                    Time
                  </p>
                  <p className="font-semibold text-white">
                    🕐 {booking.availability?.start_time?.slice(0, 5)} -{" "}
                    {booking.availability?.end_time?.slice(0, 5)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase font-bold mb-1">
                    Amount
                  </p>
                  <p className="font-semibold text-blue-400">
                    ₹{booking.amount}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-between items-center gap-3">
                {/* Add to Calendar & Maps (Only show if confirmed or completed) */}
                {(booking.status === "confirmed" ||
                  booking.status === "completed") && (
                  <div className="flex gap-2">
                    <a
                      href={generateCalendarLink(booking)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-2 rounded-lg text-sm font-semibold transition text-white"
                    >
                      📅 Add to Calendar
                    </a>
                    <a
                      href={generateMapsLink(booking)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-2 rounded-lg text-sm font-semibold transition text-white"
                    >
                      🗺️ Directions
                    </a>
                  </div>
                )}

                {/* Role-specific action buttons */}
                <div className="flex gap-3 ml-auto">
                  {role === "teacher" && booking.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-2 rounded-lg transition text-sm font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleConfirm(booking.id)}
                        className="bg-green-600 text-white hover:bg-green-500 px-4 py-2 rounded-lg transition text-sm font-semibold shadow-[0_0_15px_rgba(22,163,74,0.4)]"
                      >
                        Confirm
                      </button>
                    </>
                  )}
                  {role === "teacher" && booking.status === "confirmed" && (
                    <button
                      onClick={() => handleComplete(booking.id)}
                      className="bg-blue-600 text-white hover:bg-blue-500 px-4 py-2 rounded-lg transition text-sm font-semibold shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                    >
                      Mark Completed
                    </button>
                  )}
                  {role === "student" && booking.status === "completed" && (
                    <button
                      onClick={() => setReviewingBooking(booking.id)}
                      className="bg-yellow-500 text-black hover:bg-yellow-400 px-4 py-2 rounded-lg transition text-sm font-bold shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                    >
                      ⭐ Leave Review
                    </button>
                  )}
                  {role === "student" && booking.status === "pending" && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-2 rounded-lg transition text-sm font-semibold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {reviewingBooking === booking.id && (
                <div className="mt-4 p-5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <h4 className="font-bold text-white mb-3">
                    Rate your session
                  </h4>
                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="text-3xl transition-transform hover:scale-110"
                      >
                        {star <= rating ? "⭐" : "☆"}
                      </button>
                    ))}
                  </div>
                  <textarea
                    placeholder="How was the class? (Optional)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500 mb-3 focus:outline-none focus:border-yellow-500/50"
                    rows={2}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setReviewingBooking(null)}
                      className="px-4 py-2 text-slate-400 font-semibold hover:text-white transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => submitReview(booking)}
                      disabled={submittingReview}
                      className="bg-yellow-500 text-black px-4 py-2 font-bold rounded-lg hover:bg-yellow-400 transition disabled:opacity-50"
                    >
                      {submittingReview ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
