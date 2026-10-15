"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const supabase = createClient();

type Teacher = {
  id: string;
  bio: string;
  qualification: string;
  experience_years: number;
  hourly_fee: number;
  area: string;
  city: string;
  profiles: {
    full_name: string;
  };
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      const { data } = await supabase
        .from("teacher_profiles")
        .select(
          `
          *,
          profiles (full_name)
        `,
        )
        .order("created_at", { ascending: false });

      if (data) {
        setTeachers(data as unknown as Teacher[]);
      }
      setLoading(false);
    };

    fetchTeachers();
  }, []);

  // Filter directly during render — no useEffect needed! This fixes the ESLint error.
  const filteredTeachers = teachers.filter(
    (t) =>
      t.city?.toLowerCase().includes(search.toLowerCase()) ||
      t.area?.toLowerCase().includes(search.toLowerCase()) ||
      t.qualification?.toLowerCase().includes(search.toLowerCase()) ||
      t.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading)
    return (
      <div className="p-8 text-center text-gray-600">
        Finding teachers near you...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Find a Teacher on EduReal
          </h1>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:underline font-semibold"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search by city, area, or qualification (e.g. Bangalore, M.Sc, Koramangala)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-4 rounded-xl border border-gray-300 shadow-sm focus:border-blue-500 focus:outline-none text-lg"
          />
        </div>

        {/* Teacher Cards */}
        {filteredTeachers.length === 0 ? (
          <div className="text-center text-gray-500 p-12 bg-white rounded-xl shadow-sm">
            No teachers found matching your search. Try a different city or
            area!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                      {teacher.profiles?.full_name?.charAt(0) || "T"}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {teacher.profiles?.full_name || "Unnamed Teacher"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {teacher.qualification}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {teacher.bio}
                  </p>

                  <div className="flex justify-between items-center text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded-lg">
                    <span>
                      📍 {teacher.area}, {teacher.city}
                    </span>
                    <span>🎓 {teacher.experience_years} yrs exp</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <span className="text-xl font-bold text-blue-600">
                    ₹{teacher.hourly_fee}
                    <span className="text-sm text-gray-400 font-normal">
                      /hr
                    </span>
                  </span>
                  <Link
                    href={`/teachers/${teacher.id}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition font-semibold"
                  >
                    View & Book
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
