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
          setStats({
            upcoming: bookings.filter((b) => b.status === "confirmed").length,
            pending: bookings.filter((b) => b.status === "pending").length,
            completed: bookings.filter((b) => b.status === "completed").length,
            earnings: 0,
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
              `id, amount, status, availability (date, start_time, end_time), student:profiles!bookings_student_id_fkey (full_name)`,
            )
            .eq("teacher_id", teacherProfile.id)
            .order("created_at", { ascending: false });
          if (bookings) {
            const typed = bookings as unknown as PendingRequest[];
            setStats({
              pending: typed.filter((b) => b.status === "pending").length,
              upcoming: typed.filter((b) => b.status === "confirmed").length,
              completed: typed.filter((b) => b.status === "completed").length,
              earnings: typed
                .filter(
                  (b) => b.status === "confirmed" || b.status === "completed",
                )
                .reduce((sum, b) => sum + (b.amount || 0), 0),
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* HERO */}
      <div className="glass-panel p-8 md:p-12 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-white">
            Hi, {firstName}! 👋
          </h1>
          <p className="text-slate-300 text-lg max-w-xl">
            {isTeacher
              ? "Manage your availability, confirm bookings, and grow your teaching business."
              : "Find great teachers near you and book your next session in seconds."}
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          {
            label: isTeacher ? "Upcoming" : "Confirmed",
            val: stats.upcoming,
            icon: "📅",
          },
          { label: "Pending", val: stats.pending, icon: "⏳" },
          { label: "Completed", val: stats.completed, icon: "✅" },
          {
            label: isTeacher ? "Earned" : "Rating",
            val: isTeacher ? `₹${stats.earnings}` : "4.8",
            icon: isTeacher ? "💰" : "⭐",
          },
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-5 spatial-card cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl shadow-inner">
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

      {/* STUDENT VIEW */}
      {!isTeacher && (
        <>
          <h2 className="text-2xl font-extrabold text-white mb-4">
            What would you like to do?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <Link
              href="/teachers"
              className="glass-panel spatial-card p-8 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/40 transition-all"></div>
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
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
                Start browsing →
              </span>
            </Link>

            <Link
              href="/dashboard/bookings"
              className="glass-panel spatial-card p-8 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl group-hover:bg-orange-500/40 transition-all"></div>
              <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                📖
              </div>
              <h3 className="text-2xl font-extrabold mb-2 text-white">
                My Bookings
              </h3>
              <p className="text-slate-400 mb-4">
                View your upcoming, pending, and past sessions in one place.
              </p>
              <span className="inline-flex items-center gap-2 font-bold text-orange-400">
                See bookings →
              </span>
            </Link>
          </div>
        </>
      )}

      {/* TEACHER VIEW */}
      {isTeacher && (
        <>
          <h2 className="text-2xl font-extrabold text-white mb-4">
            Manage your teaching
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <Link
              href="/dashboard/availability"
              className="glass-panel spatial-card p-8 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/40 transition-all"></div>
              <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                📅
              </div>
              <h3 className="text-2xl font-extrabold mb-2 text-white">
                Manage Availability
              </h3>
              <p className="text-slate-400 mb-4">
                Add time slots so students can book you. Keep your schedule up
                to date.
              </p>
              <span className="inline-flex items-center gap-2 font-bold text-purple-400">
                Set slots →
              </span>
            </Link>

            <Link
              href="/dashboard/teacher-profile"
              className="glass-panel spatial-card p-8 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/40 transition-all"></div>
              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                👨‍🏫
              </div>
              <h3 className="text-2xl font-extrabold mb-2 text-white">
                Edit Profile
              </h3>
              <p className="text-slate-400 mb-4">
                Update your bio, subjects, fees, and location to attract more
                students.
              </p>
              <span className="inline-flex items-center gap-2 font-bold text-emerald-400">
                Edit profile →
              </span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
