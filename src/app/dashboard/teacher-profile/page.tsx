"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const supabase = createClient();

export default function TeacherProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [bio, setBio] = useState("");
  const [qualification, setQualification] = useState("");
  const [experience, setExperience] = useState("");
  const [fee, setFee] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [demoVideoUrl, setDemoVideoUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
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

      if (profile?.role !== "teacher") {
        router.push("/dashboard");
        return;
      }

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
        setDemoVideoUrl(teacherProfile.demo_video_url || "");
      }

      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setMessage("Error: Video is too large. Please upload a file under 50MB.");
      return;
    }

    setUploading(true);
    setMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("demos")
      .upload(filePath, file);

    if (uploadError) {
      setMessage(`Upload Error: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("demos").getPublicUrl(filePath);

    setDemoVideoUrl(publicUrl);
    setUploading(false);
    setMessage(
      'Video uploaded successfully! Don\'t forget to click "Save Profile" below. 🎥',
    );
  };

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
        demo_video_url: demoVideoUrl,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      setMessage(`Error: ${error.message}`);
      setSaving(false);
    } else {
      setMessage("Profile saved successfully! Redirecting... 🎉");

      // Wait 1 second so they see the success message, then hard reload to dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-600">Loading profile...</div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">
              Teacher Profile
            </h1>
            <p className="text-gray-600">
              Update your details to attract more students.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-blue-600 hover:underline font-semibold text-sm"
          >
            Back to Dashboard
          </button>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.includes("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* VIDEO SECTION */}
          <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
            <label className="block text-sm font-bold text-gray-800 mb-2">
              🎥 Demo Video (Highly Recommended)
            </label>
            <p className="text-xs text-gray-500 mb-4">
              Upload a short video from your device OR paste a YouTube link.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Option 1: Paste a link
                </label>
                <input
                  type="url"
                  value={demoVideoUrl}
                  onChange={(e) => setDemoVideoUrl(e.target.value)}
                  className="block w-full rounded-xl border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition bg-white"
                  placeholder="https://www.youtube.com/watch?v=... or .mp4 link"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-xs text-gray-400 font-semibold uppercase">
                  OR
                </span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Option 2: Upload from device
                </label>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  ref={fileInputRef}
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full bg-white border-2 border-dashed border-blue-300 text-blue-600 font-semibold py-4 rounded-xl hover:bg-blue-50 transition flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <span className="text-xl">📤</span> Click to upload video
                      (.mp4, .mov)
                    </>
                  )}
                </button>
              </div>

              {demoVideoUrl && !uploading && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium flex items-center gap-2">
                  <span className="text-lg">✅</span> Video is ready to be
                  saved!
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Bio / About Me
            </label>
            <textarea
              required
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="block w-full rounded-xl border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
              placeholder="I have 5 years of experience teaching Mathematics..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Qualification
              </label>
              <input
                type="text"
                required
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="block w-full rounded-xl border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                placeholder="M.Sc. Mathematics"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Experience (Years)
              </label>
              <input
                type="number"
                required
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="block w-full rounded-xl border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                placeholder="5"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Hourly Fee (₹)
              </label>
              <input
                type="number"
                required
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="block w-full rounded-xl border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                placeholder="500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Area
              </label>
              <input
                type="text"
                required
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="block w-full rounded-xl border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                placeholder="Koramangala"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="block w-full rounded-xl border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                placeholder="Bangalore"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition shadow-md"
          >
            {saving ? "Saving and redirecting..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
