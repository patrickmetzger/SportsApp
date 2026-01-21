import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  UsersIcon,
  AcademicCapIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

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
              className="md:col-span-2 lg:col-span-1 lg:row-span-2 group bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 hover:shadow-soft-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer animate-slide-up relative overflow-hidden"
            >
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="flex flex-col h-full text-white relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <UsersIcon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">User Management</h3>
                <p className="text-slate-300 text-sm mb-4 flex-grow">
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
              className="group bg-white rounded-3xl p-6 hover:shadow-soft-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border border-gray-100 animate-slide-up"
              style={{ animationDelay: '0.1s' }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors">
                <AcademicCapIcon className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Schools</h3>
              <p className="text-gray-600 text-sm">Manage schools and coaches</p>
            </a>

            <a
              href="/admin/programs"
              className="group bg-white rounded-3xl p-6 hover:shadow-soft-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border border-gray-100 animate-slide-up"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center mb-3 group-hover:bg-accent-100 transition-colors">
                <TrophyIcon className="w-7 h-7 text-accent-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Programs</h3>
              <p className="text-gray-600 text-sm">Manage all programs</p>
            </a>

            <a
              href="/admin/communications"
              className="md:col-span-2 lg:col-span-2 group bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-8 hover:shadow-soft-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer animate-slide-up relative overflow-hidden"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="flex items-center justify-between text-white relative z-10">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <ChatBubbleLeftRightIcon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Communications</h3>
                  <p className="text-primary-50 text-sm">Send announcements and messages</p>
                </div>
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>

            <div className="group bg-white rounded-3xl p-6 hover:shadow-soft-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border border-gray-100 animate-slide-up"
              style={{ animationDelay: '0.4s' }}
            >
              <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center mb-3 group-hover:bg-success-100 transition-colors">
                <ChartBarIcon className="w-7 h-7 text-success-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Analytics</h3>
              <p className="text-gray-600 text-sm">Reports and statistics</p>
            </div>

            <div className="group bg-white rounded-3xl p-6 hover:shadow-soft-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border border-gray-100 animate-slide-up"
              style={{ animationDelay: '0.5s' }}
            >
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-gray-200 transition-colors">
                <Cog6ToothIcon className="w-7 h-7 text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Settings</h3>
              <p className="text-gray-600 text-sm">System configuration</p>
            </div>

            <div className="group bg-white rounded-3xl p-6 hover:shadow-soft-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border border-gray-100 animate-slide-up"
              style={{ animationDelay: '0.6s' }}
            >
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-colors">
                <BuildingOfficeIcon className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Facilities</h3>
              <p className="text-gray-600 text-sm">Manage facilities</p>
            </div>

            <div className="group bg-white rounded-3xl p-6 hover:shadow-soft-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border border-gray-100 animate-slide-up"
              style={{ animationDelay: '0.7s' }}
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
                <CreditCardIcon className="w-7 h-7 text-emerald-600" />
              </div>
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
