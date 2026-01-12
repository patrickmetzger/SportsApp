export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center max-w-4xl mx-auto px-4">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          School Sports Management
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          A modern platform to manage athletic programs, teams, and student activities
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Login
          </a>
          <a
            href="/admin"
            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Admin
          </a>
        </div>
      </div>
    </div>
  );
}
