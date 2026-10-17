"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const supabase = createClient();

type Profile = {
  full_name: string;
  role: string;
};

type Stats = {
  upcoming: number;
  pending: number;
  completed: number;
  earnings: number;
};

type RecommendedTeacher = {
  id: string;
  qualification: string;
  hourly_fee: number;
  area: string;
  city: string;
  experience_years: number;
  profiles: { full_name: string } | null;
};

type PendingRequest = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  availability: { date: string; start_time: string; end_time: string } | null;
  student: { full_name: string } | null;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({
    upcoming: 0,
    pending: 0,
    completed: 0,
    earnings: 0,
  });
  const [recommended, setRecommended] = useState<RecommendedTeacher[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUser(user);

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      const userRole = prof?.role || "student";
      setProfile({ full_name: prof?.full_name || "User", role: userRole });

      if (userRole === "student") {
        const { data: bookings } = await supabase
          .from("bookings")
          .select("status")
          .eq("student_id", user.id);

        if (bookings) {
          const upcoming = bookings.filter(
            (b: { status: string }) => b.status === "confirmed",
          ).length;
          const pending = bookings.filter(
            (b: { status: string }) => b.status === "pending",
          ).length;
          const completed = bookings.filter(
            (b: { status: string }) => b.status === "completed",
          ).length;
          setStats({ upcoming, pending, completed, earnings: 0 });
        }

        const { data: teachers } = await supabase
          .from("teacher_profiles")
          .select(
            "id, qualification, hourly_fee, area, city, experience_years, profiles(full_name)",
          )
          .order("created_at", { ascending: false })
          .limit(3);

        if (teachers)
          setRecommended(teachers as unknown as RecommendedTeacher[]);
      } else if (userRole === "teacher") {
        const { data: teacherProfile } = await supabase
          .from("teacher_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (teacherProfile) {
          const { data: bookings } = await supabase
            .from("bookings")
            .select(
              `
              id, amount, status, created_at,
              availability (date, start_time, end_time),
              student:profiles!bookings_student_id_fkey (full_name)
            `,
            )
            .eq("teacher_id", teacherProfile.id)
            .order("created_at", { ascending: false });

          if (bookings) {
            const typed = bookings as unknown as PendingRequest[];
            const pending = typed.filter((b) => b.status === "pending").length;
            const upcoming = typed.filter(
              (b) => b.status === "confirmed",
            ).length;
            const completed = typed.filter(
              (b) => b.status === "completed",
            ).length;
            const earnings = typed
              .filter(
                (b) => b.status === "confirmed" || b.status === "completed",
              )
              .reduce((sum, b) => sum + (b.amount || 0), 0);

            setStats({ upcoming, pending, completed, earnings });
            setPendingRequests(
              typed.filter((b) => b.status === "pending").slice(0, 3),
            );
          }
        }
      }

      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4">
        <div className="text-center bg-white p-10 rounded-2xl shadow-lg max-w-md w-full">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Please log in
          </h2>
          <p className="text-gray-600 mb-6">
            You need to log in to view your dashboard.
          </p>
          <Link
            href="/login"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors duration-200 shadow-lg"
          >
            Go to Login →
          </Link>
        </div>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const isTeacher = profile?.role === "teacher";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* ==================== HERO ==================== */}
        <div
          className={`relative overflow-hidden rounded-3xl p-8 md:p-12 mb-8 text-white shadow-2xl ${
            isTeacher
              ? "bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600"
              : "bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700"
          }`}
        >
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 mb-4">
                <span className="text-lg">{isTeacher ? "👨‍🏫" : "🎓"}</span>
                <span className="text-sm font-semibold">
                  {isTeacher ? "Teacher Dashboard" : "Student Dashboard"}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
                Hi, {firstName}! 👋
              </h1>
              <p className="text-blue-100 text-lg max-w-xl">
                {isTeacher
                  ? "Manage your availability, confirm bookings, and grow your teaching business."
                  : "Find great teachers near you and book your next session in seconds."}
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/40 flex items-center justify-center text-5xl md:text-6xl font-extrabold shadow-xl">
                {profile?.full_name?.charAt(0) || "U"}
              </div>
            </div>
          </div>
        </div>

        {/* ==================== STATS ==================== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">
                📅
              </div>
              <p className="text-xs uppercase font-semibold text-gray-500 tracking-wide">
                {isTeacher ? "Upcoming" : "Confirmed"}
              </p>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">
              {stats.upcoming}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center text-xl">
                ⏳
              </div>
              <p className="text-xs uppercase font-semibold text-gray-500 tracking-wide">
                Pending
              </p>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">
              {stats.pending}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">
                ✅
              </div>
              <p className="text-xs uppercase font-semibold text-gray-500 tracking-wide">
                Completed
              </p>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">
              {stats.completed}
            </p>
          </div>

          <div
            className={`rounded-2xl p-5 shadow-sm border transition-shadow duration-200 hover:shadow-md ${
              isTeacher
                ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-100"
                : "bg-white border-gray-100"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl">
                {isTeacher ? "💰" : "⭐"}
              </div>
              <p className="text-xs uppercase font-semibold text-gray-500 tracking-wide">
                {isTeacher ? "Earned" : "Rating"}
              </p>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">
              {isTeacher ? `₹${stats.earnings}` : "4.8"}
            </p>
          </div>
        </div>

        {/* ==================== STUDENT VIEW ==================== */}
        {!isTeacher && (
          <>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-4">
              What would you like to do?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <Link
                href="/teachers"
                className="group relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-2xl transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02]"
              >
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-lg">
                    🔍
                  </div>
                  <h3 className="text-2xl font-extrabold mb-2">
                    Find a Teacher
                  </h3>
                  <p className="text-blue-100 mb-4">
                    Browse verified teachers by subject, city, and area. Book
                    instantly.
                  </p>
                  <span className="inline-flex items-center gap-2 font-semibold text-white">
                    Start browsing
                    <span className="group-hover:translate-x-1 transition-transform duration-200">
                      →
                    </span>
                  </span>
                </div>
              </Link>

              <Link
                href="/dashboard/bookings"
                className="group relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-orange-500 to-pink-600 text-white shadow-lg hover:shadow-2xl transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02]"
              >
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-lg">
                    📖
                  </div>
                  <h3 className="text-2xl font-extrabold mb-2">My Bookings</h3>
                  <p className="text-orange-100 mb-4">
                    View your upcoming, pending, and past sessions in one place.
                  </p>
                  <span className="inline-flex items-center gap-2 font-semibold text-white">
                    See bookings
                    <span className="group-hover:translate-x-1 transition-transform duration-200">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </div>

            {recommended.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-extrabold text-gray-900">
                    ✨ Featured Teachers
                  </h2>
                  <Link
                    href="/teachers"
                    className="text-blue-600 font-semibold hover:underline text-sm transition-colors duration-200"
                  >
                    View all →
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {recommended.map((t) => (
                    <Link
                      key={t.id}
                      href={`/teachers/${t.id}`}
                      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 hover:border-blue-200 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1"
                    >
                      <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                      <div className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {t.profiles?.full_name?.charAt(0) || "T"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {t.profiles?.full_name || "Teacher"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {t.qualification}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                            📍 {t.city}
                          </span>
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
                            🎓 {t.experience_years}y
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                          <span className="text-lg font-bold text-blue-600">
                            ₹{t.hourly_fee}
                            <span className="text-xs text-gray-400 font-normal">
                              /hr
                            </span>
                          </span>
                          <span className="text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform duration-200">
                            Book →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ==================== TEACHER VIEW ==================== */}
        {isTeacher && (
          <>
            {pendingRequests.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-extrabold text-gray-900">
                    🔔 New Requests
                    <span className="ml-3 text-sm font-bold bg-red-500 text-white px-3 py-1 rounded-full">
                      {stats.pending}
                    </span>
                  </h2>
                  <Link
                    href="/dashboard/bookings"
                    className="text-blue-600 font-semibold hover:underline text-sm transition-colors duration-200"
                  >
                    View all →
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {pendingRequests.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-yellow-400 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-xl">
                          🎓
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {r.student?.full_name || "Student"}
                          </p>
                          <p className="text-xs text-yellow-600 font-semibold">
                            Pending confirmation
                          </p>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1 mb-4">
                        <p>
                          📅{" "}
                          {r.availability?.date
                            ? new Date(r.availability.date).toLocaleDateString(
                                "en-IN",
                                {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                },
                              )
                            : "N/A"}
                        </p>
                        <p>
                          🕐 {r.availability?.start_time?.slice(0, 5)} -{" "}
                          {r.availability?.end_time?.slice(0, 5)}
                        </p>
                        <p className="font-semibold text-blue-600">
                          💰 ₹{r.amount}
                        </p>
                      </div>

                      <Link
                        href="/dashboard/bookings"
                        className="block w-full text-center bg-yellow-500 text-white py-2 rounded-lg font-semibold text-sm hover:bg-yellow-600 transition-colors duration-200 shadow-sm"
                      >
                        Review Request
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h2 className="text-2xl font-extrabold text-gray-900 mb-4">
              Manage your teaching
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <Link
                href="/dashboard/availability"
                className="group relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg hover:shadow-2xl transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02]"
              >
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-lg">
                    📅
                  </div>
                  <h3 className="text-2xl font-extrabold mb-2">
                    Manage Availability
                  </h3>
                  <p className="text-purple-100 mb-4">
                    Add time slots so students can book you. Keep your schedule
                    up to date.
                  </p>
                  <span className="inline-flex items-center gap-2 font-semibold text-white">
                    Set slots
                    <span className="group-hover:translate-x-1 transition-transform duration-200">
                      →
                    </span>
                  </span>
                </div>
              </Link>

              <Link
                href="/dashboard/teacher-profile"
                className="group relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-2xl transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02]"
              >
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-lg">
                    👨‍🏫
                  </div>
                  <h3 className="text-2xl font-extrabold mb-2">Edit Profile</h3>
                  <p className="text-emerald-100 mb-4">
                    Update your bio, subjects, fees, and location to attract
                    more students.
                  </p>
                  <span className="inline-flex items-center gap-2 font-semibold text-white">
                    Edit profile
                    <span className="group-hover:translate-x-1 transition-transform duration-200">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                💡 Pro Tip
              </h3>
              <p className="text-gray-700 text-sm">
                Teachers who add{" "}
                <strong>at least 5 availability slots per week</strong> get up
                to 3x more bookings. Keep your profile updated to rank higher in
                search!
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
