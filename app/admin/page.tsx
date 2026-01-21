import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminDashboard() {
  try {
    const { user } = await requireRole('admin');

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
        {/* Modern Navigation Bar */}
        <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 font-medium">{user.email}</span>
                <form action="/api/auth/logout" method="POST">
                  <button className="px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-soft hover:shadow-soft-md active:scale-95 font-medium">
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8 animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back!
            </h2>
            <p className="text-gray-600">
              Manage your entire sports management system from here
            </p>
          </div>

          {/* Bento Grid Layout - Modern asymmetric grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Primary Actions - Larger cards */}
            <a
              href="/admin/users"
              className="md:col-span-2 lg:col-span-1 lg:row-span-2 group bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 hover:shadow-soft-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer animate-slide-up"
            >
              <div className="flex flex-col h-full text-white">
                <div className="text-5xl mb-4">👥</div>
                <h3 className="text-2xl font-bold mb-2">User Management</h3>
                <p className="text-blue-50 text-sm mb-4 flex-grow">
                  Manage students, parents, coaches, and administrators
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span>Manage Users</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </a>

            <a
              href="/admin/schools"
              className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 hover:shadow-soft-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border border-gray-100 animate-slide-up"
              style={{ animationDelay: '0.1s' }}
            >
              <div className="text-4xl mb-3">🏫</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Schools</h3>
              <p className="text-gray-600 text-sm">Manage schools and coaches</p>
            </a>

            <a
              href="/admin/programs"
              className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 hover:shadow-soft-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border border-gray-100 animate-slide-up"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Programs</h3>
              <p className="text-gray-600 text-sm">Manage all programs</p>
            </a>

            <a
              href="/admin/communications"
              className="md:col-span-2 lg:col-span-2 group bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-8 hover:shadow-soft-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer animate-slide-up"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="flex items-center justify-between text-white">
                <div>
                  <div className="text-4xl mb-3">💬</div>
                  <h3 className="text-xl font-bold mb-2">Communications</h3>
                  <p className="text-purple-50 text-sm">Send announcements and messages</p>
                </div>
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>

            <div className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 hover:shadow-soft-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border border-gray-100 animate-slide-up"
              style={{ animationDelay: '0.4s' }}
            >
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Analytics</h3>
              <p className="text-gray-600 text-sm">Reports and statistics</p>
            </div>

            <div className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 hover:shadow-soft-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border border-gray-100 animate-slide-up"
              style={{ animationDelay: '0.5s' }}
            >
              <div className="text-4xl mb-3">⚙️</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Settings</h3>
              <p className="text-gray-600 text-sm">System configuration</p>
            </div>

            <div className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 hover:shadow-soft-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border border-gray-100 animate-slide-up"
              style={{ animationDelay: '0.6s' }}
            >
              <div className="text-4xl mb-3">🏟️</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Facilities</h3>
              <p className="text-gray-600 text-sm">Manage facilities</p>
            </div>

            <div className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 hover:shadow-soft-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border border-gray-100 animate-slide-up"
              style={{ animationDelay: '0.7s' }}
            >
              <div className="text-4xl mb-3">💳</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Payments</h3>
              <p className="text-gray-600 text-sm">Track finances</p>
            </div>
          </div>

          {/* System Status Banner */}
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-200/50 rounded-2xl p-6 backdrop-blur-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <h3 className="font-semibold text-green-900">System Status</h3>
                <p className="text-green-700 text-sm">All systems operational</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
