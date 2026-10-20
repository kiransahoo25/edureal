"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const supabase = createClient();

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const router = useRouter();

  // Profile Data
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");

  // Password Change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Delete Account Confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email || "");

      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, role")
        .eq("id", user.id)
        .single();

      if (data) {
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setRole(data.role || "student");
      }
      setLoading(false);
    };
    fetchProfile();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("id", user.id);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Profile updated successfully! 🎉" });
      router.refresh(); // Update Navbar
    }
    setSaving(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({
        type: "success",
        text: "Password changed successfully! 🔒",
      });
      setNewPassword("");
      setConfirmPassword("");
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE") {
      setMessage({ type: "error", text: "Please type DELETE to confirm." });
      return;
    }

    setSaving(true);
    setMessage(null);

    // Call the secure database function we created
    const { error } = await supabase.rpc("delete_my_account");

    if (error) {
      setMessage({ type: "error", text: error.message });
      setSaving(false);
    } else {
      await supabase.auth.signOut();
      window.location.href = "/";
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading profile...
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">My Profile</h1>
          <p className="text-slate-400">
            Manage your account settings and preferences.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl mb-8 text-sm font-bold ${message.type === "error" ? "bg-red-500/20 text-red-200 border border-red-500/30" : "bg-green-500/20 text-green-200 border border-green-500/30"}`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {/* Personal Information */}
        <div className="glass-panel p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg border border-white/20">
              {fullName?.charAt(0) || email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Personal Information
              </h2>
              <p className="text-slate-400 text-sm capitalize">
                {role} Account
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Email Address (Read Only)
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-slate-400 cursor-not-allowed"
              />
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
                className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-500 transition shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Security / Password */}
        <div className="glass-panel p-8">
          <h2 className="text-xl font-bold text-white mb-6">Security</h2>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || !newPassword}
              className="bg-white/10 border border-white/20 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-white/20 transition disabled:opacity-50"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="border border-red-500/30 bg-red-500/5 rounded-3xl p-8">
          <h2 className="text-xl font-bold text-red-400 mb-2">Danger Zone</h2>
          <p className="text-slate-400 text-sm mb-6">
            Once you delete your account, there is no going back. All your data,
            bookings, and reviews will be permanently removed.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-500/20 text-red-400 border border-red-500/30 px-6 py-2.5 rounded-xl font-bold hover:bg-red-500/30 transition"
            >
              Delete Account
            </button>
          ) : (
            <div className="bg-black/40 p-6 rounded-2xl border border-red-500/30 space-y-4">
              <p className="text-white font-bold text-sm">
                Are you absolutely sure?
              </p>
              <p className="text-slate-400 text-sm">
                Please type <strong className="text-white">DELETE</strong> to
                confirm.
              </p>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="DELETE"
                className="w-full rounded-xl bg-black/20 border border-red-500/50 px-4 py-3 text-white focus:outline-none focus:border-red-500"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== "DELETE" || saving}
                  className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-500 transition disabled:opacity-50"
                >
                  {saving ? "Deleting..." : "Permanently Delete"}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteInput("");
                  }}
                  className="text-slate-400 hover:text-white px-4 py-2.5 font-bold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
