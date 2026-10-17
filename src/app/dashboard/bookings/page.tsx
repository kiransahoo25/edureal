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

  useEffect(() => {
    const fetchBookings = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Get user's role
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

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Booking cancelled.");
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelled" } : b,
        ),
      );
    }
  };

  const handleConfirm = async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      // Notify the student via email
      fetch("/api/notify-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, type: "confirmed" }),
      }).catch((err) => console.error("Notify failed:", err));

      setMessage("Booking confirmed! Student has been emailed. 🎉");
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "confirmed" } : b,
        ),
      );
    }
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
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:underline font-semibold"
          >
            Back to Dashboard
          </Link>
        </div>

        {message && (
          <div
            className={`p-3 rounded mb-4 text-sm font-medium ${message.includes("Error") ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"}`}
          >
            {message}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-md text-center">
            <p className="text-gray-500 mb-4">You have no bookings yet.</p>
            {role === "student" && (
              <Link
                href="/teachers"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
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
                className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
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
                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(booking.status)}`}
                  >
                    {booking.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg mb-4">
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">Date</p>
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
                    <p className="text-gray-500 text-xs uppercase mb-1">Time</p>
                    <p className="font-semibold">
                      🕐 {booking.availability?.start_time?.slice(0, 5)} -{" "}
                      {booking.availability?.end_time?.slice(0, 5)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Amount
                    </p>
                    <p className="font-semibold text-blue-600">
                      ₹{booking.amount}
                    </p>
                  </div>
                </div>

                {booking.status === "pending" && (
                  <div className="flex justify-end gap-3">
                    {role === "teacher" && (
                      <button
                        onClick={() => handleConfirm(booking.id)}
                        className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg transition text-sm font-medium"
                      >
                        Confirm Booking
                      </button>
                    )}
                    <button
                      onClick={() => handleCancel(booking.id)}
                      className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition text-sm font-medium"
                    >
                      Cancel
                    </button>
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
