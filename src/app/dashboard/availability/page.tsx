"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const supabase = createClient();
type Slot = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
};
const getTomorrow = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
};

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [date, setDate] = useState(getTomorrow());
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [capacity, setCapacity] = useState("1");
  const router = useRouter();

  useEffect(() => {
    const fetchSlots = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: teacherProfile } = await supabase
        .from("teacher_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!teacherProfile) {
        setMessage("Please complete your teacher profile first.");
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("availability")
        .select("*")
        .eq("teacher_id", teacherProfile.id)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });
      if (data) setSlots(data);
      setLoading(false);
    };
    fetchSlots();
  }, [router]);

  const refreshSlots = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: teacherProfile } = await supabase
      .from("teacher_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!teacherProfile) return;
    const { data } = await supabase
      .from("availability")
      .select("*")
      .eq("teacher_id", teacherProfile.id)
      .order("date", { ascending: true });
    if (data) setSlots(data);
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (startTime >= endTime) {
      setMessage("Error: End time must be after start time.");
      return;
    }
    setSaving(true);
    setMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: teacherProfile } = await supabase
      .from("teacher_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!teacherProfile) {
      setMessage("Error: Teacher profile not found.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("availability")
      .insert({
        teacher_id: teacherProfile.id,
        date,
        start_time: startTime,
        end_time: endTime,
        capacity: parseInt(capacity) || 1,
      });

    if (error) setMessage(`Error: ${error.message}`);
    else {
      setMessage("Time slot added! 🎉");
      setDate(getTomorrow());
      setStartTime("10:00");
      setEndTime("11:00");
      setCapacity("1");
      await refreshSlots();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this slot?")) return;
    await supabase.from("availability").delete().eq("id", id);
    await refreshSlots();
  };

  if (loading)
    return (
      <div className="text-center text-slate-400 p-8">
        Loading your schedule...
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-white">My Availability</h1>
        <button
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

      <div className="glass-panel p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 text-white">
          Add a New Time Slot
        </h2>
        <form
          onSubmit={handleAddSlot}
          className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
        >
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl bg-black/20 border border-white/10 p-3 text-white focus:border-blue-500/50 focus:outline-none [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-1">
              Start Time
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl bg-black/20 border border-white/10 p-3 text-white focus:border-blue-500/50 focus:outline-none [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-1">
              End Time
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-xl bg-black/20 border border-white/10 p-3 text-white focus:border-blue-500/50 focus:outline-none [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-1">
              Capacity
            </label>
            <input
              type="number"
              min="1"
              required
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full rounded-xl bg-black/20 border border-white/10 p-3 text-white focus:border-blue-500/50 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-blue-500 disabled:opacity-50 transition shadow-[0_0_15px_rgba(37,99,235,0.4)] w-full"
          >
            {saving ? "Adding..." : "Add Slot"}
          </button>
        </form>
      </div>

      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold mb-4 text-white">
          Your Upcoming Slots
        </h2>
        {slots.length === 0 ? (
          <p className="text-slate-400 text-center py-8">
            No slots added yet. Add one above!
          </p>
        ) : (
          <div className="space-y-3">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-white/5 rounded-xl border border-white/10 gap-4 hover:border-white/20 transition"
              >
                <div className="flex gap-6 items-center">
                  <div>
                    <p className="font-bold text-white text-lg">
                      📅{" "}
                      {new Date(slot.date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <p className="text-slate-400 font-medium">
                      🕐 {slot.start_time.slice(0, 5)} -{" "}
                      {slot.end_time.slice(0, 5)}
                    </p>
                  </div>
                  <div className="text-xs font-bold text-blue-300 bg-blue-500/20 px-3 py-1.5 rounded-full border border-blue-500/20">
                    👥 {slot.booked_count} / {slot.capacity} booked
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(slot.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl transition text-sm font-semibold w-full sm:w-auto"
                >
                  Delete Slot
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
