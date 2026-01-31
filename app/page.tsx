export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-50 via-white to-ocean-50">
      <div className="text-center max-w-4xl mx-auto px-8">
        <div className="w-16 h-1 bg-gold-500 mx-auto mb-8 rounded-full"></div>
        <h1 className="text-6xl lg:text-7xl font-black tracking-tighter text-black mb-6 leading-none">
          School Sports<br />Management
        </h1>
        <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
          A modern platform to manage athletic programs, teams, and student activities
        </p>
        <div className="flex gap-4 max-w-md mx-auto">
          <a
            href="/login"
            className="flex-1 text-center px-8 py-4 bg-black text-white text-sm font-semibold uppercase tracking-wider rounded-xl hover:bg-gray-800 transition-all duration-300"
          >
            Login
          </a>
          <a
            href="/programs"
            className="flex-1 text-center px-8 py-4 bg-cream-100 text-black text-sm font-semibold uppercase tracking-wider rounded-xl hover:bg-cream-200 transition-all duration-300"
          >
            Programs
          </a>
        </div>
      </div>
    </div>
  );
}
