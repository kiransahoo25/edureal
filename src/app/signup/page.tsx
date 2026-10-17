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
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
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
    <div className="min-h-screen flex">
      {/* Left Side — Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8 py-12 relative overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-block mb-8">
            <span className="text-3xl font-extrabold text-blue-600">
              EduReal
            </span>
          </Link>

          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            Create your account
          </h1>
          <p className="text-gray-600 mb-8">
            Join EduReal and start your learning journey today.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-6">
            {/* Custom Role Selector */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                I want to join as a...
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                    role === "student"
                      ? "border-blue-600 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-blue-300 bg-white hover:bg-gray-50"
                  }`}
                >
                  <span className="text-3xl mb-2">🎓</span>
                  <span
                    className={`font-bold ${role === "student" ? "text-blue-700" : "text-gray-700"}`}
                  >
                    Student
                  </span>
                  <span className="text-xs text-gray-500 mt-1 text-center">
                    I want to learn
                  </span>
                  {role === "student" && (
                    <div className="absolute top-3 right-3 text-blue-600 text-lg">
                      ✓
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                    role === "teacher"
                      ? "border-purple-600 bg-purple-50 shadow-md"
                      : "border-gray-200 hover:border-purple-300 bg-white hover:bg-gray-50"
                  }`}
                >
                  <span className="text-3xl mb-2">👨‍🏫</span>
                  <span
                    className={`font-bold ${role === "teacher" ? "text-purple-700" : "text-gray-700"}`}
                  >
                    Teacher
                  </span>
                  <span className="text-xs text-gray-500 mt-1 text-center">
                    I want to teach
                  </span>
                  {role === "teacher" && (
                    <div className="absolute top-3 right-3 text-purple-600 text-lg">
                      ✓
                    </div>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
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
              <label className="block text-sm font-bold text-gray-700 mb-2">
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
              className={`w-full py-3 px-4 rounded-xl font-bold text-white transition shadow-lg hover:shadow-xl disabled:opacity-50 ${
                role === "teacher"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating account...
                </span>
              ) : (
                `Sign Up as ${role === "teacher" ? "Teacher" : "Student"}`
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-600 hover:underline font-bold"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side — Illustration */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-indigo-600 via-blue-700 to-purple-800 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col justify-center px-16 text-white h-full">
          <div className="text-6xl mb-6">🚀</div>
          <h2 className="text-4xl font-extrabold mb-4 leading-tight">
            Start your journey with EduReal today.
          </h2>
          <p className="text-blue-100 text-lg mb-10">
            Whether you want to share your knowledge or learn something new,
            EduReal connects you with the right people.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-2xl shadow-inner">
                🎓
              </div>
              <div>
                <p className="font-bold text-lg">For Students</p>
                <p className="text-sm text-blue-200">
                  Find verified teachers near you.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
              <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-2xl shadow-inner">
                👨‍🏫
              </div>
              <div>
                <p className="font-bold text-lg">For Teachers</p>
                <p className="text-sm text-blue-200">
                  Manage your schedule and grow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
