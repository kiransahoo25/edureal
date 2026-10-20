"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const supabase = createClient();

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (
    e?: React.FormEvent,
    customEmail?: string,
    customPassword?: string,
  ) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPassword = customPassword || password;

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const fillDemo = (role: "teacher" | "student") => {
    const demoEmail = `${role}@edureal.com`;
    const demoPass = "demo1234";
    setEmail(demoEmail);
    setPassword(demoPass);
    handleLogin(undefined, demoEmail, demoPass);
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4">
      <div className="glass-panel w-full max-w-md p-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl"></div>

        <Link href="/" className="inline-block mb-8 relative z-10">
          <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            EduReal
          </span>
        </Link>

        <h1 className="text-3xl font-extrabold text-white mb-2 relative z-10">
          Welcome back 👋
        </h1>
        <p className="text-slate-400 mb-8 relative z-10">
          Log in to continue your learning journey.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 relative z-10 shadow-inner">
          <h3 className="font-bold text-slate-200 mb-3 text-sm uppercase tracking-wide">
            🚀 Try Instantly
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => fillDemo("student")}
              disabled={loading}
              className="bg-white/10 border border-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition flex flex-col items-center gap-1"
            >
              <span className="text-xl">🎓</span> Student
            </button>
            <button
              onClick={() => fillDemo("teacher")}
              disabled={loading}
              className="bg-white/10 border border-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition flex flex-col items-center gap-1"
            >
              <span className="text-xl">👨‍🏫</span> Teacher
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 text-sm relative z-10">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
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
            <label className="block text-sm font-semibold text-slate-300 mb-2">
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
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:from-blue-500 hover:to-purple-500 transition shadow-[0_0_20px_rgba(79,70,229,0.4)] disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-400 relative z-10">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
          >
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
