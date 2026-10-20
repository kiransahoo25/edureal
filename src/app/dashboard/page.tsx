"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const supabase = createClient();

type Profile = { full_name: string; role: string };
type Stats = {
  upcoming: number;
  pending: number;
  completed: number;
  earnings: number;
  totalStudents: number;
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

// FIX: Added student_id to the type definition
type PendingRequest = {
  id: string;
  student_id: string;
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
    totalStudents: 0,
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
          setStats({
            upcoming: bookings.filter((b) => b.status === "confirmed").length,
            pending: bookings.filter((b) => b.status === "pending").length,
            completed: bookings.filter((b) => b.status === "completed").length,
            earnings: 0,
            totalStudents: 0,
          });
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
              `id, student_id, amount, status, availability (date, start_time, end_time), student:profiles!bookings_student_id_fkey (full_name)`,
            )
            .eq("teacher_id", teacherProfile.id)
            .order("created_at", { ascending: false });

          if (bookings) {
            const typed = bookings as unknown as PendingRequest[];
            const completedAndConfirmed = typed.filter(
              (b) => b.status === "confirmed" || b.status === "completed",
            );

            setStats({
              pending: typed.filter((b) => b.status === "pending").length,
              upcoming: typed.filter((b) => b.status === "confirmed").length,
              completed: typed.filter((b) => b.status === "completed").length,
              earnings: completedAndConfirmed.reduce(
                (sum, b) => sum + (b.amount || 0),
                0,
              ),
              totalStudents: new Set(typed.map((b) => b.student_id)).size, // Now this line works perfectly
            });
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

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  if (!user)
    return <div className="text-center mt-20 text-white">Please log in.</div>;

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const isTeacher = profile?.role === "teacher";

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="glass-panel p-8 md:p-12 mb-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-white">
                Hi, {firstName}! 👋
              </h1>
              <p className="text-slate-300 text-lg max-w-xl">
                {isTeacher
                  ? "Here is your teaching performance overview."
                  : "Find great teachers and book your next session."}
              </p>
            </div>
            <Link
              href="/dashboard/profile"
              className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-xl text-sm font-bold text-white transition"
            >
              <span className="text-lg">⚙️</span> Edit Profile
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          {[
            {
              label: "Upcoming",
              val: stats.upcoming,
              icon: "📅",
              color: "text-blue-400",
            },
            {
              label: "Pending",
              val: stats.pending,
              icon: "⏳",
              color: "text-yellow-400",
            },
            {
              label: "Completed",
              val: stats.completed,
              icon: "✅",
              color: "text-green-400",
            },
            {
              label: isTeacher ? "Total Earned" : "Rating",
              val: isTeacher ? `₹${stats.earnings}` : "4.8",
              icon: isTeacher ? "💰" : "⭐",
              color: "text-emerald-400",
            },
            ...(isTeacher
              ? [
                  {
                    label: "Students",
                    val: stats.totalStudents,
                    icon: "👥",
                    color: "text-purple-400",
                  },
                ]
              : []),
          ].map((stat, i) => (
            <div key={i} className="glass-panel p-5 spatial-card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{stat.icon}</span>
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  {stat.label}
                </p>
              </div>
              <p className={`text-3xl font-extrabold ${stat.color}`}>
                {stat.val}
              </p>
            </div>
          ))}
        </div>

        {!isTeacher && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <Link
              href="/teachers"
              className="glass-panel spatial-card p-8 group"
            >
              <h3 className="text-2xl font-extrabold mb-2 text-white">
                Find a Teacher 🔍
              </h3>
              <p className="text-slate-400">
                Browse verified teachers by subject and city.
              </p>
            </Link>
            <Link
              href="/dashboard/bookings"
              className="glass-panel spatial-card p-8 group"
            >
              <h3 className="text-2xl font-extrabold mb-2 text-white">
                My Bookings 📖
              </h3>
              <p className="text-slate-400">
                View your upcoming and past sessions.
              </p>
            </Link>
          </div>
        )}

        {isTeacher && (
          <>
            {pendingRequests.length > 0 && (
              <div className="mb-10">
                <h2 className="text-2xl font-extrabold text-white mb-4">
                  🔔 New Requests
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {pendingRequests.map((r) => (
                    <div
                      key={r.id}
                      className="glass-panel p-5 border-l-4 border-l-yellow-400"
                    >
                      <p className="font-bold text-white">
                        {r.student?.full_name}
                      </p>
                      <p className="text-sm text-slate-400">
                        📅 {r.availability?.date} at{" "}
                        {r.availability?.start_time?.slice(0, 5)}
                      </p>
                      <Link
                        href="/dashboard/bookings"
                        className="block w-full text-center bg-yellow-500 text-black py-2 rounded-lg font-bold text-sm mt-4 hover:bg-yellow-400 transition"
                      >
                        Review
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <Link
                href="/dashboard/availability"
                className="glass-panel spatial-card p-8 group"
              >
                <h3 className="text-2xl font-extrabold mb-2 text-white">
                  Manage Availability 📅
                </h3>
                <p className="text-slate-400">Add time slots for students.</p>
              </Link>
              <Link
                href="/dashboard/teacher-profile"
                className="glass-panel spatial-card p-8 group"
              >
                <h3 className="text-2xl font-extrabold mb-2 text-white">
                  Teacher Setup 👨‍🏫
                </h3>
                <p className="text-slate-400">Update your teaching profile.</p>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
