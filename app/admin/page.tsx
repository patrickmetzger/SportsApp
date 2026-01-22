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
      <div className="min-h-screen bg-white">
        {/* Premium Navigation Bar */}
        <nav className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-8 lg:px-16">
            <div className="flex justify-between h-20 items-center">
              <div>
                <h1 className="text-sm uppercase tracking-widest font-light text-black">
                  Dashboard
                </h1>
              </div>
              <div className="flex items-center gap-8">
                <span className="text-sm font-light text-gray-500">{user.email}</span>
                <form action="/api/auth/logout" method="POST">
                  <button className="px-6 py-2 bg-black text-white text-xs uppercase tracking-wider hover:bg-gray-900 transition-all duration-300 font-light">
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-8 lg:px-16 py-16 lg:py-24">
          {/* Hero Welcome Section */}
          <div className="mb-24 space-y-6">
            <div className="w-12 h-0.5 bg-gold-500"></div>
            <h2 className="text-6xl lg:text-7xl font-extralight tracking-tighter text-black leading-none">
              Command<br />Center
            </h2>
            <p className="text-xl font-light text-gray-500 max-w-2xl leading-relaxed">
              Orchestrate every aspect of your athletic programs with precision and elegance.
            </p>
          </div>

          {/* Premium Magazine Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-gray-100 border border-gray-100 mb-24">
            {/* User Management - Featured */}
            <a
              href="/admin/users"
              className="bg-black text-white p-12 lg:p-16 group hover:bg-gray-900 transition-all duration-500 lg:row-span-2"
            >
              <div className="flex flex-col h-full justify-between space-y-12">
                <div className="space-y-6">
                  <UsersIcon className="w-10 h-10 text-gold-400" />
                  <div>
                    <h3 className="text-3xl font-light mb-3 tracking-tight">User Management</h3>
                    <p className="text-gray-400 font-light leading-relaxed">
                      Administer the complete lifecycle of all system participants
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm uppercase tracking-widest text-gold-400">
                  <span>Enter</span>
                  <svg className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </a>

            {/* Schools */}
            <a href="/admin/schools" className="bg-white p-12 group hover:bg-cream-50 transition-all duration-500">
              <div className="space-y-6">
                <AcademicCapIcon className="w-8 h-8 text-black" />
                <div>
                  <h3 className="text-xl font-light mb-2 tracking-tight">Schools</h3>
                  <p className="text-gray-500 text-sm font-light">Institution oversight and management</p>
                </div>
              </div>
            </a>

            {/* Programs */}
            <a href="/admin/programs" className="bg-white p-12 group hover:bg-cream-50 transition-all duration-500">
              <div className="space-y-6">
                <TrophyIcon className="w-8 h-8 text-black" />
                <div>
                  <h3 className="text-xl font-light mb-2 tracking-tight">Programs</h3>
                  <p className="text-gray-500 text-sm font-light">Athletic program administration</p>
                </div>
              </div>
            </a>

            {/* Communications */}
            <a href="/admin/communications" className="bg-white p-12 group hover:bg-cream-50 transition-all duration-500">
              <div className="space-y-6">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-black" />
                <div>
                  <h3 className="text-xl font-light mb-2 tracking-tight">Communications</h3>
                  <p className="text-gray-500 text-sm font-light">Broadcast and messaging</p>
                </div>
              </div>
            </a>

            {/* Analytics */}
            <div className="bg-white p-12 group hover:bg-cream-50 transition-all duration-500 cursor-pointer">
              <div className="space-y-6">
                <ChartBarIcon className="w-8 h-8 text-black" />
                <div>
                  <h3 className="text-xl font-light mb-2 tracking-tight">Analytics</h3>
                  <p className="text-gray-500 text-sm font-light">Performance insights</p>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white p-12 group hover:bg-cream-50 transition-all duration-500 cursor-pointer">
              <div className="space-y-6">
                <Cog6ToothIcon className="w-8 h-8 text-black" />
                <div>
                  <h3 className="text-xl font-light mb-2 tracking-tight">Settings</h3>
                  <p className="text-gray-500 text-sm font-light">System configuration</p>
                </div>
              </div>
            </div>

            {/* Facilities */}
            <div className="bg-white p-12 group hover:bg-cream-50 transition-all duration-500 cursor-pointer">
              <div className="space-y-6">
                <BuildingOfficeIcon className="w-8 h-8 text-black" />
                <div>
                  <h3 className="text-xl font-light mb-2 tracking-tight">Facilities</h3>
                  <p className="text-gray-500 text-sm font-light">Venue management</p>
                </div>
              </div>
            </div>

            {/* Payments */}
            <div className="bg-white p-12 group hover:bg-cream-50 transition-all duration-500 cursor-pointer">
              <div className="space-y-6">
                <CreditCardIcon className="w-8 h-8 text-black" />
                <div>
                  <h3 className="text-xl font-light mb-2 tracking-tight">Payments</h3>
                  <p className="text-gray-500 text-sm font-light">Financial tracking</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="border-t border-gray-100 pt-16">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-gray-400 font-medium">System Status</p>
                <p className="text-sm font-light text-black">All systems operational</p>
              </div>
              <div className="w-2 h-2 bg-gold-500 rounded-full"></div>
            </div>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
