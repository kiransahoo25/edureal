import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-extrabold text-blue-600 mb-4 tracking-tight">
          EduReal
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Connect with expert teachers for physical classes near you. Book
          sessions, manage your schedule, and learn in person.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-md"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
