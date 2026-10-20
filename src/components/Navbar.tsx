"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const supabase = createClient();

type Profile = {
  full_name: string;
  role: string;
};

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
    };

    getUser();
    const { data: listener } = supabase.auth.onAuthStateChange(() => getUser());
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push("/");
    router.refresh();
  };

  if (pathname === "/login" || pathname === "/signup") return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="glass-panel px-6 py-3 w-full max-w-5xl flex justify-between items-center rounded-full">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            EduReal
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link
                href="/teachers"
                className="text-slate-300 hover:text-white font-medium transition-colors"
              >
                Find Teachers
              </Link>
              <Link
                href="/dashboard"
                className="text-slate-300 hover:text-white font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/bookings"
                className="text-slate-300 hover:text-white font-medium transition-colors"
              >
                My Bookings
              </Link>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors border border-white/10"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm shadow-lg">
                    {profile?.full_name?.charAt(0) || "U"}
                  </div>
                  <span className="text-sm font-medium text-white">
                    {profile?.full_name?.split(" ")[0] || "User"}
                  </span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-3 w-48 glass-panel py-2 border border-white/10">
                    <div className="px-4 py-2 border-b border-white/10">
                      <p className="text-sm font-semibold text-white">
                        {profile?.full_name}
                      </p>
                      <p className="text-xs text-slate-400 capitalize">
                        {profile?.role}
                      </p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      My Profile
                    </Link>
                    {profile?.role === "teacher" && (
                      <Link
                        href="/dashboard/availability"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10"
                      >
                        My Availability
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-slate-300 hover:text-white font-medium transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="bg-white/10 text-white px-5 py-2 rounded-full hover:bg-white/20 transition-colors font-medium border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-white"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </nav>
    </div>
  );
}
