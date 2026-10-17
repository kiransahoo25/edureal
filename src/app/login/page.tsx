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
    <div className="min-h-screen flex">
      {/* Left Side — Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-block mb-10">
            <span className="text-3xl font-extrabold text-blue-600">
              EduReal
            </span>
          </Link>

          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            Welcome back 👋
          </h1>
          <p className="text-gray-600 mb-8">
            Log in to continue your learning journey.
          </p>

          {/* DEMO ACCOUNTS SECTION */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-8">
            <h3 className="font-bold text-blue-900 mb-3 text-sm uppercase tracking-wide">
              🚀 Try EduReal Instantly
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fillDemo("student")}
                disabled={loading}
                className="bg-white border-2 border-blue-200 hover:border-blue-500 text-blue-700 font-semibold py-3 px-4 rounded-xl transition flex flex-col items-center justify-center gap-1 shadow-sm"
              >
                <span className="text-xl">🎓</span>
                <span>Demo Student</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("teacher")}
                disabled={loading}
                className="bg-white border-2 border-purple-200 hover:border-purple-500 text-purple-700 font-semibold py-3 px-4 rounded-xl transition flex flex-col items-center justify-center gap-1 shadow-sm"
              >
                <span className="text-xl">👨‍🏫</span>
                <span>Demo Teacher</span>
              </button>
            </div>
            <p className="text-xs text-blue-600 mt-3 text-center">
              Click above to auto-fill and login.
            </p>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Or log in manually
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition shadow-lg hover:shadow-xl"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-blue-600 hover:underline font-semibold"
            >
              Sign up free
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side — Illustration */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col justify-center px-16 text-white">
          <div className="text-6xl mb-6">🎓</div>
          <h2 className="text-4xl font-extrabold mb-4 leading-tight">
            Your learning journey continues here.
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Pick up right where you left off. Your teachers, your schedule, your
            progress.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3">
              <span className="text-2xl">✅</span>
              <span className="font-medium">Verified teachers near you</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3">
              <span className="text-2xl">📅</span>
              <span className="font-medium">Instant booking & reminders</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3">
              <span className="text-2xl">⭐</span>
              <span className="font-medium">Rate & review your teachers</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
