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
  availability: {
    date: string;
    start_time: string;
    end_time: string;
  } | null;
  teacher_profiles: {
    id: string;
    user_id: string;
    area: string;
    city: string;
    profiles: {
      full_name: string;
    } | null;
  } | null;
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("student");
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  // Review State
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
            `
            *,
            availability (date, start_time, end_time),
            teacher_profiles (
              id, user_id, area, city,
              profiles (full_name)
            )
          `,
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
              `
              *,
              availability (date, start_time, end_time),
              teacher_profiles (
                id, user_id, area, city,
                profiles (full_name)
              )
            `,
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
      }).catch((err) => console.error("Notify failed:", err));
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
      setMessage("Booking marked as completed.");
    }
  };

  const submitReview = async (booking: Booking) => {
    setSubmittingReview(true);
    const { error } = await supabase.from("reviews").insert({
      booking_id: booking.id,
      teacher_id: booking.teacher_profiles?.id,
      rating,
      comment,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Review submitted! Thank you. ⭐");
      setReviewingBooking(null);
      setComment("");
      setRating(5);
      // Mark booking as reviewed locally (optional, but we will just close the modal)
    }
    setSubmittingReview(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-600">
        Loading your bookings...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900">My Bookings</h1>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:underline font-semibold"
          >
            Back to Dashboard
          </Link>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl mb-6 text-sm font-bold ${message.includes("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}
          >
            {message}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-md text-center">
            <p className="text-gray-500 mb-4 text-lg">
              You have no bookings yet.
            </p>
            {role === "student" && (
              <Link
                href="/teachers"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition font-semibold shadow-md"
              >
                Find a Teacher
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {role === "student"
                        ? `👨‍🏫 ${booking.teacher_profiles?.profiles?.full_name || "Teacher"}`
                        : `🎓 Booking by Student`}
                    </h3>
                    {role === "student" && booking.teacher_profiles?.area && (
                      <p className="text-sm text-gray-500">
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

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700 bg-gray-50 p-4 rounded-xl mb-4">
                  <div>
                    <p className="text-gray-500 text-xs uppercase font-bold mb-1">
                      Date
                    </p>
                    <p className="font-semibold">
                      📅{" "}
                      {booking.availability?.date
                        ? new Date(
                            booking.availability.date,
                          ).toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase font-bold mb-1">
                      Time
                    </p>
                    <p className="font-semibold">
                      🕐 {booking.availability?.start_time?.slice(0, 5)} -{" "}
                      {booking.availability?.end_time?.slice(0, 5)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase font-bold mb-1">
                      Amount
                    </p>
                    <p className="font-semibold text-blue-600">
                      ₹{booking.amount}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  {/* TEACHER ACTIONS */}
                  {role === "teacher" && booking.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition text-sm font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleConfirm(booking.id)}
                        className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg transition text-sm font-semibold shadow-sm"
                      >
                        Confirm Booking
                      </button>
                    </>
                  )}
                  {role === "teacher" && booking.status === "confirmed" && (
                    <button
                      onClick={() => handleComplete(booking.id)}
                      className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg transition text-sm font-semibold shadow-sm"
                    >
                      Mark as Completed
                    </button>
                  )}

                  {/* STUDENT ACTIONS */}
                  {role === "student" && booking.status === "completed" && (
                    <button
                      onClick={() => setReviewingBooking(booking.id)}
                      className="bg-yellow-500 text-white hover:bg-yellow-600 px-4 py-2 rounded-lg transition text-sm font-semibold shadow-sm"
                    >
                      ⭐ Leave a Review
                    </button>
                  )}
                  {role === "student" && booking.status === "pending" && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition text-sm font-semibold"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {/* REVIEW FORM (Shows inline if selected) */}
                {reviewingBooking === booking.id && (
                  <div className="mt-4 p-5 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <h4 className="font-bold text-gray-900 mb-3">
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
                      className="w-full p-3 rounded-xl border border-gray-300 mb-3 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100"
                      rows={2}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setReviewingBooking(null)}
                        className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-lg transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => submitReview(booking)}
                        disabled={submittingReview}
                        className="bg-yellow-500 text-white px-4 py-2 font-bold rounded-lg hover:bg-yellow-600 transition disabled:opacity-50"
                      >
                        {submittingReview ? "Submitting..." : "Submit Review"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
