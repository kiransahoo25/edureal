"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const supabase = createClient();

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: role } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4 py-8">
      <div className="glass-panel w-full max-w-lg p-8 relative overflow-hidden">
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl"></div>

        <Link href="/" className="inline-block mb-8 relative z-10">
          <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            EduReal
          </span>
        </Link>

        <h1 className="text-3xl font-extrabold text-white mb-2 relative z-10">
          Create your account
        </h1>
        <p className="text-slate-400 mb-8 relative z-10">
          Join EduReal and start your learning journey today.
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 text-sm relative z-10">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-3">
              I want to join as a...
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 ${role === "student" ? "border-blue-500 bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10"}`}
              >
                <span className="text-3xl mb-2">🎓</span>
                <span
                  className={`font-bold ${role === "student" ? "text-white" : "text-slate-400"}`}
                >
                  Student
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRole("teacher")}
                className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 ${role === "teacher" ? "border-purple-500 bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.3)]" : "border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10"}`}
              >
                <span className="text-3xl mb-2">👨‍🏫</span>
                <span
                  className={`font-bold ${role === "teacher" ? "text-white" : "text-slate-400"}`}
                >
                  Teacher
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-white transition shadow-[0_0_20px_rgba(0,0,0,0.5)] disabled:opacity-50 ${role === "teacher" ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"}`}
          >
            {loading
              ? "Creating account..."
              : `Sign Up as ${role === "teacher" ? "Teacher" : "Student"}`}
          </button>
        </form>
        <p className="mt-8 text-center text-slate-400 relative z-10">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-400 hover:text-blue-300 font-bold transition-colors"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
