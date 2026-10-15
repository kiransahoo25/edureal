"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function TeacherProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form fields
  const [bio, setBio] = useState("");
  const [qualification, setQualification] = useState("");
  const [experience, setExperience] = useState("");
  const [fee, setFee] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      // 1. Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 2. Check if user is a teacher
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "teacher") {
        router.push("/dashboard"); // Kick students out
        return;
      }

      // 3. Fetch existing teacher profile if it exists
      const { data: teacherProfile } = await supabase
        .from("teacher_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (teacherProfile) {
        setBio(teacherProfile.bio || "");
        setQualification(teacherProfile.qualification || "");
        setExperience(teacherProfile.experience_years?.toString() || "");
        setFee(teacherProfile.hourly_fee?.toString() || "");
        setArea(teacherProfile.area || "");
        setCity(teacherProfile.city || "");
      }

      setLoading(false);
    };

    fetchProfile();
  }, [router, supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("teacher_profiles").upsert(
      {
        user_id: user.id,
        bio,
        qualification,
        experience_years: parseInt(experience) || 0,
        hourly_fee: parseFloat(fee) || 0,
        area,
        city,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Profile saved successfully! 🎉");
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-2">Teacher Profile Setup</h1>
        <p className="text-gray-600 mb-6">
          Fill in your details so students can find and book you.
        </p>

        {message && (
          <div
            className={`p-3 rounded mb-4 text-sm ${message.includes("Error") ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"}`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Bio / About Me
            </label>
            <textarea
              required
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none"
              placeholder="I have 5 years of experience teaching Mathematics..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Qualification
              </label>
              <input
                type="text"
                required
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none"
                placeholder="M.Sc. Mathematics"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Experience (Years)
              </label>
              <input
                type="number"
                required
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none"
                placeholder="5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Hourly Fee (₹)
              </label>
              <input
                type="number"
                required
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none"
                placeholder="500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Area / Locality
              </label>
              <input
                type="text"
                required
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none"
                placeholder="Koramangala"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none"
              placeholder="Bangalore"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
