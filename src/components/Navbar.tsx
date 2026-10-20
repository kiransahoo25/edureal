"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const supabase = createClient();

type Profile = { full_name: string; role: string };
type Notif = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  link: string;
};

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notif[]>([]);

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

        // Fetch Notifications
        const { data: notifs } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        if (notifs) setNotifications(notifs);
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

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen && unreadCount > 0 && user) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  };

  if (pathname === "/login" || pathname === "/signup") return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="glass-panel px-6 py-3 w-full max-w-5xl flex justify-between items-center rounded-full relative z-50">
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

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={markAsRead}
                  className="relative p-2 text-slate-300 hover:text-white transition"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-3 w-72 glass-panel border border-white/10 p-4 shadow-2xl">
                    <h4 className="font-bold text-white mb-2 text-sm uppercase">
                      Notifications
                    </h4>
                    {notifications.length === 0 ? (
                      <p className="text-slate-400 text-sm">
                        No new notifications.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {notifications.map((n) => (
                          <Link
                            key={n.id}
                            href={n.link}
                            onClick={() => setNotifOpen(false)}
                            className={`block p-2 rounded-lg ${n.is_read ? "bg-transparent" : "bg-white/10"}`}
                          >
                            <p className="text-sm font-bold text-white">
                              {n.title}
                            </p>
                            <p className="text-xs text-slate-400">
                              {n.message}
                            </p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

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
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10"
                    >
                      My Profile
                    </Link>
                    {profile?.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-yellow-400 hover:text-yellow-300 hover:bg-white/10"
                      >
                        Admin Panel
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
      </nav>
    </div>
  );
}
