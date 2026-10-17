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

// Helper to get tomorrow's date in YYYY-MM-DD format
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

  // Pre-filled Form state
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
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });
    if (data) setSlots(data);
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();

    // Quick validation
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

    const { error } = await supabase.from("availability").insert({
      teacher_id: teacherProfile.id,
      date,
      start_time: startTime,
      end_time: endTime,
      capacity: parseInt(capacity) || 1,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Time slot added! 🎉");
      // Reset to defaults so they can quickly add another slot
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
      <div className="p-8 text-center text-gray-600">
        Loading your schedule...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900">
            My Availability
          </h1>
          <button
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

        {/* Add Slot Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            Add a New Time Slot
          </h2>
          <form
            onSubmit={handleAddSlot}
            className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
          >
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Capacity
              </label>
              <input
                type="number"
                min="1"
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition shadow-md w-full"
            >
              {saving ? "Adding..." : "Add Slot"}
            </button>
          </form>
        </div>

        {/* Slots List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            Your Upcoming Slots
          </h2>
          {slots.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No slots added yet. Add one above!
            </p>
          ) : (
            <div className="space-y-3">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-gray-50 rounded-xl border border-gray-200 gap-4 hover:border-blue-300 transition"
                >
                  <div className="flex gap-6 items-center">
                    <div>
                      <p className="font-bold text-gray-900 text-lg">
                        📅{" "}
                        {new Date(slot.date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      <p className="text-gray-600 font-medium">
                        🕐 {slot.start_time.slice(0, 5)} -{" "}
                        {slot.end_time.slice(0, 5)}
                      </p>
                    </div>
                    <div className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full">
                      👥 {slot.booked_count} / {slot.capacity} booked
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(slot.id)}
                    className="text-red-500 hover:bg-red-50 border border-red-100 px-4 py-2 rounded-xl transition text-sm font-semibold w-full sm:w-auto"
                  >
                    Delete Slot
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
