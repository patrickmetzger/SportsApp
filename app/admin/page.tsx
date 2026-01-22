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
  CreditCardIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export default async function AdminDashboard() {
  try {
    await requireRole('admin');

    return (
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome to the admin command center</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Users</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">2,847</p>
              </div>
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-teal-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-sm">
              <ArrowTrendingUpIcon className="w-4 h-4 text-teal-500" />
              <span className="text-teal-600 font-medium">12%</span>
              <span className="text-slate-400">vs last month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Schools</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">48</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <AcademicCapIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-sm">
              <ArrowTrendingUpIcon className="w-4 h-4 text-teal-500" />
              <span className="text-teal-600 font-medium">4</span>
              <span className="text-slate-400">new this month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Programs</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">156</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                <TrophyIcon className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-sm">
              <span className="text-slate-400">Across all schools</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Athletes</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">1,892</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-sm">
              <ArrowTrendingUpIcon className="w-4 h-4 text-teal-500" />
              <span className="text-teal-600 font-medium">8%</span>
              <span className="text-slate-400">vs last month</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Management */}
            <a
              href="/admin/users"
              className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                    User Management
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Manage all system users and permissions
                  </p>
                </div>
              </div>
            </a>

            {/* Schools */}
            <a
              href="/admin/schools"
              className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AcademicCapIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                    Schools
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Institution oversight and management
                  </p>
                </div>
              </div>
            </a>

            {/* Programs */}
            <a
              href="/admin/programs"
              className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrophyIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                    Programs
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Athletic program administration
                  </p>
                </div>
              </div>
            </a>

            {/* Communications */}
            <a
              href="/admin/communications"
              className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                    Communications
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Broadcast and messaging center
                  </p>
                </div>
              </div>
            </a>

            {/* Analytics */}
            <a
              href="/admin/analytics"
              className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                    Analytics
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Performance insights and reports
                  </p>
                </div>
              </div>
            </a>

            {/* Settings */}
            <a
              href="/admin/settings"
              className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Cog6ToothIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                    Settings
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    System configuration
                  </p>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-medium text-slate-900">System Status</p>
                <p className="text-sm text-slate-500">All systems operational</p>
              </div>
            </div>
            <span className="text-xs text-slate-400">Last checked: Just now</span>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
