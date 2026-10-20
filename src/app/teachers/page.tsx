"use client";

import { useState, useEffect, useRef } from "react";
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
  subjects: string[];
  profiles: { full_name: string } | null;
};

const ALL_SUBJECTS = [
  "All",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Computer Science",
  "History",
  "Economics",
];

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [loading, setLoading] = useState(true);

  // Autocomplete State
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      const { data } = await supabase
        .from("teacher_profiles")
        .select(`*, profiles (full_name)`)
        .order("created_at", { ascending: false });

      if (data) {
        // Cast to our strict Teacher type instead of using 'any'
        const typedTeachers = data as unknown as Teacher[];
        setTeachers(typedTeachers);

        // Extract unique cities and areas for suggestions
        const locations = new Set<string>();
        typedTeachers.forEach((t) => {
          if (t.city) locations.add(t.city);
          if (t.area) locations.add(t.area);
        });
        setAllLocations(Array.from(locations).sort());
      }
      setLoading(false);
    };
    fetchTeachers();
  }, []);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);

    if (value.trim().length > 0) {
      const filtered = allLocations.filter((loc) =>
        loc.toLowerCase().includes(value.toLowerCase()),
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (location: string) => {
    setSearch(location);
    setShowSuggestions(false);
  };

  const filteredTeachers = teachers.filter((t) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      t.city?.toLowerCase().includes(searchLower) ||
      t.area?.toLowerCase().includes(searchLower) ||
      t.qualification?.toLowerCase().includes(searchLower) ||
      t.profiles?.full_name?.toLowerCase().includes(searchLower);

    const matchesSubject =
      selectedSubject === "All" || t.subjects?.includes(selectedSubject);
    const matchesPrice = t.hourly_fee <= maxPrice;
    return matchesSearch && matchesSubject && matchesPrice;
  });

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-lg">
        Finding teachers near you...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-white mb-2">
          Find your perfect teacher 🎓
        </h1>
        <p className="text-slate-400 text-lg">
          Browse verified teachers by subject, city, and budget.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-6 mb-8 flex flex-col lg:flex-row gap-6 items-end shadow-lg relative z-20">
        {/* Autocomplete Search Box */}
        <div className="flex-1 w-full relative" ref={searchRef}>
          <label className="block text-sm font-bold text-slate-300 mb-2">
            🔍 Search
          </label>
          <input
            type="text"
            placeholder="e.g. Koramangala, Priya, M.Sc"
            value={search}
            onChange={handleSearchChange}
            onFocus={() => {
              if (search.length > 0) setShowSuggestions(true);
            }}
            className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="text-xs font-bold text-slate-400 px-4 py-2 bg-white/5 border-b border-white/5 uppercase tracking-wider">
                📍 Locations
              </div>
              {suggestions.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(loc)}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-blue-500/20 hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="text-blue-400">📍</span> {loc}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-full lg:w-64 relative z-10">
          <label className="block text-sm font-bold text-slate-300 mb-2">
            📚 Subject
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white focus:border-blue-500/50 focus:outline-none appearance-none"
          >
            {ALL_SUBJECTS.map((sub) => (
              <option key={sub} value={sub} className="bg-slate-900 text-white">
                {sub}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full lg:w-64 relative z-10">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-bold text-slate-300">
              💰 Max Price
            </label>
            <span className="text-blue-400 font-bold text-sm">
              ₹{maxPrice}/hr
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="2000"
            step="100"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
      </div>

      <p className="text-sm text-slate-400 mb-6 relative z-10">
        <span className="font-semibold text-white">
          {filteredTeachers.length}
        </span>{" "}
        teacher{filteredTeachers.length !== 1 ? "s" : ""} found
      </p>

      {filteredTeachers.length === 0 ? (
        <div className="glass-panel p-16 text-center relative z-10">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-white mb-2">
            No teachers found
          </h3>
          <p className="text-slate-400">
            Try adjusting your filters or searching for a different city.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {filteredTeachers.map((teacher) => (
            <div
              key={teacher.id}
              className="glass-panel spatial-card overflow-hidden flex flex-col"
            >
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg border border-white/20 flex-shrink-0">
                    {teacher.profiles?.full_name?.charAt(0) || "T"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-white truncate">
                      {teacher.profiles?.full_name || "Unnamed Teacher"}
                    </h3>
                    <p className="text-sm text-slate-400 truncate">
                      {teacher.qualification || "Teacher"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {teacher.subjects && teacher.subjects.length > 0 ? (
                    teacher.subjects.map((sub) => (
                      <span
                        key={sub}
                        className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-1 rounded-md font-semibold"
                      >
                        {sub}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">
                      No subjects listed
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-300 mb-4 line-clamp-2">
                  {teacher.bio || "No bio added yet."}
                </p>

                <div className="flex flex-wrap gap-2 mb-4 mt-auto">
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full font-medium border border-blue-500/20">
                    📍 {teacher.area || "Area"}, {teacher.city || "City"}
                  </span>
                  <span className="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full font-medium border border-green-500/20">
                    🎓 {teacher.experience_years} yr
                    {teacher.experience_years !== 1 ? "s" : ""} exp
                  </span>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-400">Starting from</p>
                    <p className="text-xl font-bold text-white">
                      ₹{teacher.hourly_fee}
                      <span className="text-xs text-slate-400 font-normal">
                        /hr
                      </span>
                    </p>
                  </div>
                  <Link
                    href={`/teachers/${teacher.id}`}
                    className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/20 transition shadow-sm"
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
  );
}
