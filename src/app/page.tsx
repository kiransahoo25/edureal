import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium">
                  Now live in your city
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
                Find the perfect
                <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  teacher near you
                </span>
              </h1>

              <p className="text-xl text-blue-100 mb-8 max-w-lg">
                Connect with expert teachers for physical classes. Book
                sessions, learn in person, and grow faster with EduReal.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="bg-white text-blue-700 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg hover:shadow-xl text-center"
                >
                  Get Started Free →
                </Link>
                <Link
                  href="/teachers"
                  className="bg-white/10 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition text-center"
                >
                  Browse Teachers
                </Link>
              </div>

              <div className="flex items-center gap-6 mt-10 pt-8 border-t border-white/20">
                <div>
                  <p className="text-3xl font-bold">100+</p>
                  <p className="text-sm text-blue-200">Expert Teachers</p>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div>
                  <p className="text-3xl font-bold">500+</p>
                  <p className="text-sm text-blue-200">Classes Booked</p>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div>
                  <p className="text-3xl font-bold">4.8★</p>
                  <p className="text-sm text-blue-200">Avg Rating</p>
                </div>
              </div>
            </div>

            {/* Illustration */}
            <div className="hidden lg:block relative">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur-3xl opacity-30"></div>
                <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-white/90 rounded-2xl p-4 shadow-xl">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        A
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">Aarav Sharma</p>
                        <p className="text-sm text-gray-500">
                          Mathematics · ₹500/hr
                        </p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                        Verified
                      </span>
                    </div>

                    <div className="flex items-center gap-3 bg-white/90 rounded-2xl p-4 shadow-xl ml-8">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                        P
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">Priya Patel</p>
                        <p className="text-sm text-gray-500">
                          Physics · ₹600/hr
                        </p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                        Verified
                      </span>
                    </div>

                    <div className="flex items-center gap-3 bg-white/90 rounded-2xl p-4 shadow-xl">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-lg">
                        R
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">Rohan Kumar</p>
                        <p className="text-sm text-gray-500">
                          Chemistry · ₹450/hr
                        </p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                        Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Why choose EduReal?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We make finding and booking teachers simple, safe, and reliable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 hover:shadow-xl transition">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg">
                🔍
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Find Near You
              </h3>
              <p className="text-gray-700">
                Search by city, area, and subject. Find the perfect teacher in
                your neighborhood.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 hover:shadow-xl transition">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg">
                ✅
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Verified Teachers
              </h3>
              <p className="text-gray-700">
                Every teacher is verified for qualifications and experience.
                Learn with confidence.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 hover:shadow-xl transition">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg">
                📅
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Instant Booking
              </h3>
              <p className="text-gray-700">
                Book a session in seconds. Get email confirmations and reminders
                automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600">
              Book your first class in 3 easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="text-center relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center text-4xl text-white font-extrabold mx-auto mb-6 shadow-xl">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sign Up</h3>
              <p className="text-gray-600">
                Create a free account as a student or teacher in under a minute.
              </p>
            </div>

            <div className="text-center relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center text-4xl text-white font-extrabold mx-auto mb-6 shadow-xl">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Find a Teacher
              </h3>
              <p className="text-gray-600">
                Browse verified teachers by subject, location, and price.
              </p>
            </div>

            <div className="text-center relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-orange-500 rounded-3xl flex items-center justify-center text-4xl text-white font-extrabold mx-auto mb-6 shadow-xl">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Book & Meet
              </h3>
              <p className="text-gray-600">
                Pick a slot, book instantly, and meet your teacher in person.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Ready to start learning?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join hundreds of students and teachers on EduReal today.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-blue-700 px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition shadow-2xl"
          >
            Get Started Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-2xl font-extrabold text-white">EduReal</div>
            <p className="text-sm">
              © 2026 EduReal. Making education accessible, one class at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
