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
  } | null;
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

      if (data) setTeachers(data as unknown as Teacher[]);
      setLoading(false);
    };
    fetchTeachers();
  }, []);

  // Filter during render (no useEffect — cleaner and faster)
  const filteredTeachers = teachers.filter(
    (t) =>
      t.city?.toLowerCase().includes(search.toLowerCase()) ||
      t.area?.toLowerCase().includes(search.toLowerCase()) ||
      t.qualification?.toLowerCase().includes(search.toLowerCase()) ||
      t.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">Finding teachers near you...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            Find your perfect teacher 🎓
          </h1>
          <p className="text-gray-600 text-lg">
            Browse verified teachers by subject, city, or area
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-xl">🔍</span>
          </div>
          <input
            type="text"
            placeholder="Search by city, area, or qualification (e.g. Bangalore, M.Sc, Koramangala)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-lg bg-white"
          />
        </div>

        {/* Result count */}
        <p className="text-sm text-gray-600 mb-4">
          <span className="font-semibold text-gray-900">
            {filteredTeachers.length}
          </span>{" "}
          teacher{filteredTeachers.length !== 1 ? "s" : ""} found
          {search && ` for "${search}"`}
        </p>

        {/* Teacher Grid */}
        {filteredTeachers.length === 0 ? (
          <div className="text-center bg-white p-16 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No teachers found
            </h3>
            <p className="text-gray-600">
              Try a different city, area, or qualification.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-200 border border-gray-100 hover:border-blue-200 overflow-hidden flex flex-col"
              >
                {/* Colored top strip */}
                <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>

                <div className="p-6 flex flex-col flex-1">
                  {/* Header with avatar */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {teacher.profiles?.full_name?.charAt(0) || "T"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 truncate">
                        {teacher.profiles?.full_name || "Unnamed Teacher"}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {teacher.qualification || "Teacher"}
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {teacher.bio || "No bio added yet."}
                  </p>

                  {/* Info chips */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                      📍 {teacher.area || "Area"}, {teacher.city || "City"}
                    </span>
                    <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium">
                      🎓 {teacher.experience_years} yr
                      {teacher.experience_years !== 1 ? "s" : ""} exp
                    </span>
                  </div>

                  {/* Price + button */}
                  <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Starting from</p>
                      <p className="text-xl font-bold text-blue-600">
                        ₹{teacher.hourly_fee}
                        <span className="text-xs text-gray-400 font-normal">
                          /hr
                        </span>
                      </p>
                    </div>
                    <Link
                      href={`/teachers/${teacher.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
