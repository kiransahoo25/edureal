import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden glass-panel p-10 md:p-20 text-center mb-12">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 mb-8 shadow-inner">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-slate-200">
              Now live in your city
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-white tracking-tight">
            Find the perfect
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              teacher near you
            </span>
          </h1>

          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Connect with expert teachers for physical classes. Book sessions,
            learn in person, and grow faster with EduReal.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-slate-100 transition shadow-[0_0_20px_rgba(255,255,255,0.3)] text-center"
            >
              Get Started Free →
            </Link>
            <Link
              href="/teachers"
              className="bg-white/10 border border-white/20 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition text-center backdrop-blur-sm"
            >
              Browse Teachers
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Why choose EduReal?
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "🔍",
              title: "Find Near You",
              desc: "Search by city, area, and subject. Find the perfect teacher in your neighborhood.",
            },
            {
              icon: "✅",
              title: "Verified Teachers",
              desc: "Every teacher is verified for qualifications and experience. Learn with confidence.",
            },
            {
              icon: "📅",
              title: "Instant Booking",
              desc: "Book a session in seconds. Get email confirmations and reminders automatically.",
            },
          ].map((feature, i) => (
            <div key={i} className="glass-panel spatial-card p-8 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-inner">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="glass-panel p-10 mb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            How it works
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Sign Up",
              desc: "Create a free account as a student or teacher in under a minute.",
            },
            {
              step: "2",
              title: "Find a Teacher",
              desc: "Browse verified teachers by subject, location, and price.",
            },
            {
              step: "3",
              title: "Book & Meet",
              desc: "Pick a slot, book instantly, and meet your teacher in person.",
            },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl text-white font-extrabold mx-auto mb-4 shadow-lg">
                {item.step}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
