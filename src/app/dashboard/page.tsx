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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-panel text-center p-10 max-w-md w-full">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Please log in</h2>
          <p className="text-slate-400 mb-6">
            You need to log in to view your dashboard.
          </p>
          <Link
            href="/login"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-500 transition shadow-[0_0_20px_rgba(37,99,235,0.4)]"
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
    <div className="min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* ==================== HERO ==================== */}
        <div className="glass-panel p-8 md:p-12 mb-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-4 shadow-inner">
                <span className="text-lg">{isTeacher ? "👨‍🏫" : "🎓"}</span>
                <span className="text-sm font-semibold text-white">
                  {isTeacher ? "Teacher Dashboard" : "Student Dashboard"}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-white">
                Hi, {firstName}! 👋
              </h1>
              <p className="text-slate-300 text-lg max-w-xl">
                {isTeacher
                  ? "Manage your availability, confirm bookings, and grow your teaching business."
                  : "Find great teachers near you and book your next session in seconds."}
              </p>
            </div>

            {/* Edit Profile Button & Avatar */}
            <div className="flex-shrink-0 flex flex-col md:flex-row items-center gap-4">
              <Link
                href="/dashboard/profile"
                className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-xl text-sm font-bold text-white transition shadow-sm"
              >
                <span className="text-lg">⚙️</span> Edit Profile
              </Link>
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/10 backdrop-blur-md border-4 border-white/20 flex items-center justify-center text-5xl md:text-6xl font-extrabold text-white shadow-2xl">
                {profile?.full_name?.charAt(0) || "U"}
              </div>
            </div>
          </div>
        </div>

        {/* ==================== STATS ==================== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            {
              label: isTeacher ? "Upcoming" : "Confirmed",
              val: stats.upcoming,
              icon: "📅",
              color: "bg-blue-500/20 text-blue-400",
            },
            {
              label: "Pending",
              val: stats.pending,
              icon: "⏳",
              color: "bg-yellow-500/20 text-yellow-400",
            },
            {
              label: "Completed",
              val: stats.completed,
              icon: "✅",
              color: "bg-green-500/20 text-green-400",
            },
            {
              label: isTeacher ? "Earned" : "Rating",
              val: isTeacher ? `₹${stats.earnings}` : "4.8",
              icon: isTeacher ? "💰" : "⭐",
              color: "bg-emerald-500/20 text-emerald-400",
            },
          ].map((stat, i) => (
            <div key={i} className="glass-panel p-5 spatial-card">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center text-xl shadow-inner border border-white/10`}
                >
                  {stat.icon}
                </div>
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  {stat.label}
                </p>
              </div>
              <p className="text-3xl font-extrabold text-white">{stat.val}</p>
            </div>
          ))}
        </div>

        {/* ==================== STUDENT VIEW ==================== */}
        {!isTeacher && (
          <>
            <h2 className="text-2xl font-extrabold text-white mb-4">
              What would you like to do?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <Link
                href="/teachers"
                className="group relative overflow-hidden glass-panel spatial-card p-8"
              >
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-lg">
                    🔍
                  </div>
                  <h3 className="text-2xl font-extrabold mb-2 text-white">
                    Find a Teacher
                  </h3>
                  <p className="text-slate-400 mb-4">
                    Browse verified teachers by subject, city, and area. Book
                    instantly.
                  </p>
                  <span className="inline-flex items-center gap-2 font-bold text-blue-400">
                    Start browsing
                    <span className="group-hover:translate-x-1 transition-transform duration-200">
                      →
                    </span>
                  </span>
                </div>
              </Link>

              <Link
                href="/dashboard/bookings"
                className="group relative overflow-hidden glass-panel spatial-card p-8"
              >
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-orange-500/20 rounded-full blur-2xl group-hover:bg-orange-500/30 transition-all"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-orange-500/20 border border-orange-500/30 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-lg">
                    📖
                  </div>
                  <h3 className="text-2xl font-extrabold mb-2 text-white">
                    My Bookings
                  </h3>
                  <p className="text-slate-400 mb-4">
                    View your upcoming, pending, and past sessions in one place.
                  </p>
                  <span className="inline-flex items-center gap-2 font-bold text-orange-400">
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
                  <h2 className="text-2xl font-extrabold text-white">
                    ✨ Featured Teachers
                  </h2>
                  <Link
                    href="/teachers"
                    className="text-blue-400 font-semibold hover:text-blue-300 transition-colors text-sm"
                  >
                    View all →
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {recommended.map((t) => (
                    <Link
                      key={t.id}
                      href={`/teachers/${t.id}`}
                      className="group glass-panel spatial-card overflow-hidden flex flex-col"
                    >
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg border border-white/20">
                            {t.profiles?.full_name?.charAt(0) || "T"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">
                              {t.profiles?.full_name || "Teacher"}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {t.qualification}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-md font-medium border border-blue-500/20">
                            📍 {t.city}
                          </span>
                          <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-md font-medium border border-green-500/20">
                            🎓 {t.experience_years}y exp
                          </span>
                        </div>
                        <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center">
                          <span className="text-lg font-bold text-white">
                            ₹{t.hourly_fee}
                            <span className="text-xs text-slate-400 font-normal">
                              /hr
                            </span>
                          </span>
                          <span className="text-sm font-semibold text-blue-400 group-hover:translate-x-1 transition-transform duration-200">
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
                  <h2 className="text-2xl font-extrabold text-white flex items-center">
                    🔔 New Requests
                    <span className="ml-3 text-sm font-bold bg-red-500 text-white px-3 py-1 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                      {stats.pending}
                    </span>
                  </h2>
                  <Link
                    href="/dashboard/bookings"
                    className="text-blue-400 font-semibold hover:text-blue-300 transition-colors text-sm"
                  >
                    View all →
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {pendingRequests.map((r) => (
                    <div
                      key={r.id}
                      className="glass-panel p-5 border-l-4 border-l-yellow-400 spatial-card"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-xl">
                          🎓
                        </div>
                        <div>
                          <p className="font-bold text-white">
                            {r.student?.full_name || "Student"}
                          </p>
                          <p className="text-xs text-yellow-400 font-semibold">
                            Pending confirmation
                          </p>
                        </div>
                      </div>

                      <div className="text-sm text-slate-300 space-y-1 mb-4">
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
                        <p className="font-semibold text-blue-400">
                          💰 ₹{r.amount}
                        </p>
                      </div>

                      <Link
                        href="/dashboard/bookings"
                        className="block w-full text-center bg-yellow-500 text-black py-2 rounded-lg font-bold text-sm hover:bg-yellow-400 transition-colors shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                      >
                        Review Request
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h2 className="text-2xl font-extrabold text-white mb-4">
              Manage your teaching
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <Link
                href="/dashboard/availability"
                className="group relative overflow-hidden glass-panel spatial-card p-8"
              >
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-all"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/30 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-lg">
                    📅
                  </div>
                  <h3 className="text-2xl font-extrabold mb-2 text-white">
                    Manage Availability
                  </h3>
                  <p className="text-slate-400 mb-4">
                    Add time slots so students can book you. Keep your schedule
                    up to date.
                  </p>
                  <span className="inline-flex items-center gap-2 font-bold text-purple-400">
                    Set slots
                    <span className="group-hover:translate-x-1 transition-transform duration-200">
                      →
                    </span>
                  </span>
                </div>
              </Link>

              <Link
                href="/dashboard/teacher-profile"
                className="group relative overflow-hidden glass-panel spatial-card p-8"
              >
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-all"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-lg">
                    👨‍🏫
                  </div>
                  <h3 className="text-2xl font-extrabold mb-2 text-white">
                    Teacher Setup
                  </h3>
                  <p className="text-slate-400 mb-4">
                    Update your bio, subjects, fees, and location to attract
                    more students.
                  </p>
                  <span className="inline-flex items-center gap-2 font-bold text-emerald-400">
                    Edit teaching profile
                    <span className="group-hover:translate-x-1 transition-transform duration-200">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </div>

            <div className="glass-panel p-6 border border-yellow-500/30 bg-yellow-500/5">
              <h3 className="font-bold text-yellow-400 mb-2 flex items-center gap-2">
                💡 Pro Tip
              </h3>
              <p className="text-slate-300 text-sm">
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
