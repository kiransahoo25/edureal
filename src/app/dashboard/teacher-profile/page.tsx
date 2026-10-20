"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const supabase = createClient();
const ALL_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Computer Science",
  "History",
  "Economics",
];

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
  const [subjects, setSubjects] = useState<string[]>([]);

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
        setSubjects(teacherProfile.subjects || []);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [router]);

  const toggleSubject = (subject: string) => {
    setSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject],
    );
  };

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

    const { error: uploadError } = await supabase.storage
      .from("demos")
      .upload(fileName, file);
    if (uploadError) {
      setMessage(`Upload Error: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("demos").getPublicUrl(fileName);
    setDemoVideoUrl(publicUrl);
    setUploading(false);
    setMessage("Video uploaded successfully! 🎥");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (subjects.length === 0) {
      setMessage("Error: Please select at least one subject.");
      setSaving(false);
      return;
    }

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
        subjects,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      setMessage(`Error: ${error.message}`);
      setSaving(false);
    } else {
      setMessage("Profile saved successfully! Redirecting... 🎉");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    }
  };

  if (loading)
    return (
      <div className="text-center text-slate-400 p-8">Loading profile...</div>
    );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="glass-panel p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-1">
              Teacher Profile
            </h1>
            <p className="text-slate-400">
              Update your details to attract more students.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-blue-400 hover:text-blue-300 font-semibold text-sm transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.includes("Error") ? "bg-red-500/20 text-red-200 border border-red-500/30" : "bg-green-500/20 text-green-200 border border-green-500/30"}`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-purple-500/10 p-6 rounded-2xl border border-purple-500/20">
            <label className="block text-sm font-bold text-slate-200 mb-2">
              📚 Subjects You Teach
            </label>
            <div className="flex flex-wrap gap-3 mt-3">
              {ALL_SUBJECTS.map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => toggleSubject(subject)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${subjects.includes(subject) ? "bg-purple-600 border-purple-500 text-white shadow-[0_0_10px_rgba(147,51,234,0.5)]" : "bg-white/5 border-white/10 text-slate-400 hover:border-white/30 hover:text-white"}`}
                >
                  {subjects.includes(subject) ? "✓ " : "+ "} {subject}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-500/10 p-6 rounded-2xl border border-blue-500/20">
            <label className="block text-sm font-bold text-slate-200 mb-2">
              🎥 Demo Video (Highly Recommended)
            </label>
            <div className="space-y-4 mt-3">
              <input
                type="url"
                value={demoVideoUrl}
                onChange={(e) => setDemoVideoUrl(e.target.value)}
                className="block w-full rounded-xl bg-black/20 border border-white/10 p-3 text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none"
                placeholder="https://www.youtube.com/watch?v=... or .mp4 link"
              />

              <div className="flex items-center gap-4">
                <div className="flex-1 border-t border-white/10"></div>
                <span className="text-xs text-slate-500 font-semibold uppercase">
                  OR
                </span>
                <div className="flex-1 border-t border-white/10"></div>
              </div>

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
                className="w-full bg-white/5 border-2 border-dashed border-blue-500/30 text-blue-400 font-semibold py-4 rounded-xl hover:bg-white/10 hover:border-blue-500/50 transition flex items-center justify-center gap-2"
              >
                {uploading
                  ? "Uploading..."
                  : "📤 Click to upload video (.mp4, .mov)"}
              </button>
              {demoVideoUrl && !uploading && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400 font-medium">
                  ✅ Video ready to be saved!
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              Bio / About Me
            </label>
            <textarea
              required
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="block w-full rounded-xl bg-black/20 border border-white/10 p-3 text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none"
              placeholder="I have 5 years of experience teaching Mathematics..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Qualification
              </label>
              <input
                type="text"
                required
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="block w-full rounded-xl bg-black/20 border border-white/10 p-3 text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none"
                placeholder="M.Sc. Mathematics"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Experience (Years)
              </label>
              <input
                type="number"
                required
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="block w-full rounded-xl bg-black/20 border border-white/10 p-3 text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none"
                placeholder="5"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Hourly Fee (₹)
              </label>
              <input
                type="number"
                required
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="block w-full rounded-xl bg-black/20 border border-white/10 p-3 text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none"
                placeholder="500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Area
              </label>
              <input
                type="text"
                required
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="block w-full rounded-xl bg-black/20 border border-white/10 p-3 text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none"
                placeholder="Koramangala"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                City
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="block w-full rounded-xl bg-black/20 border border-white/10 p-3 text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none"
                placeholder="Bangalore"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 transition shadow-[0_0_20px_rgba(79,70,229,0.4)]"
          >
            {saving ? "Saving and redirecting..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
