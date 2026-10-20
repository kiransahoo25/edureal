"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const supabase = createClient();

type Teacher = {
  id: string;
  user_id: string;
  qualification: string;
  city: string;
  area: string;
  verification_status: string;
  profiles: { full_name: string; email: string };
};

export default function AdminPanel() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

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
      if (profile?.role !== "admin") {
        setLoading(false);
        return; // Not an admin, kick them out
      }
      setIsAdmin(true);

      const { data } = await supabase
        .from("teacher_profiles")
        .select("*, profiles (full_name, email)")
        .order("created_at", { ascending: false });
      if (data) setTeachers(data as unknown as Teacher[]);
      setLoading(false);
    };
    init();
  }, [router]);

  const toggleVerification = async (
    teacherId: string,
    currentStatus: string,
  ) => {
    const newStatus = currentStatus === "verified" ? "pending" : "verified";
    await supabase
      .from("teacher_profiles")
      .update({ verification_status: newStatus })
      .eq("id", teacherId);
    setTeachers((prev) =>
      prev.map((t) =>
        t.id === teacherId ? { ...t, verification_status: newStatus } : t,
      ),
    );
  };

  if (loading)
    return (
      <div className="text-center text-slate-400 p-8">Checking access...</div>
    );
  if (!isAdmin)
    return (
      <div className="text-center text-red-400 p-8 text-xl font-bold">
        Access Denied. You are not an admin.
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Admin Panel 🛡️</h1>
          <p className="text-slate-400">
            Verify teachers to show the green badge on their profile.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-blue-400 hover:text-blue-300 font-semibold"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="p-4 text-slate-300 font-bold">Teacher</th>
              <th className="p-4 text-slate-300 font-bold">Location</th>
              <th className="p-4 text-slate-300 font-bold">Status</th>
              <th className="p-4 text-slate-300 font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr
                key={t.id}
                className="border-b border-white/5 hover:bg-white/5 transition"
              >
                <td className="p-4">
                  <p className="font-bold text-white">
                    {t.profiles?.full_name}
                  </p>
                  <p className="text-sm text-slate-400">{t.profiles?.email}</p>
                </td>
                <td className="p-4 text-slate-300">
                  {t.area}, {t.city}
                </td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${t.verification_status === "verified" ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"}`}
                  >
                    {t.verification_status.toUpperCase()}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() =>
                      toggleVerification(t.id, t.verification_status)
                    }
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition ${t.verification_status === "verified" ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-green-600 text-white hover:bg-green-500"}`}
                  >
                    {t.verification_status === "verified"
                      ? "Remove Verification"
                      : "Verify Teacher"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
