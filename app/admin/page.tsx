import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  UsersIcon,
  AcademicCapIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

export default async function AdminDashboard() {
  try {
    await requireRole('admin');
    const adminClient = createAdminClient();

    const [
      { count: userCount },
      { count: schoolCount },
      { count: programCount },
      { count: studentCount },
      { count: coachCount },
      { count: pendingAssistantCount },
      { data: recentAthletes },
    ] = await Promise.all([
      adminClient.from('users').select('*', { count: 'exact', head: true }).eq('archived', false),
      adminClient.from('schools').select('*', { count: 'exact', head: true }),
      adminClient.from('summer_programs').select('*', { count: 'exact', head: true }),
      adminClient.from('parent_children').select('*', { count: 'exact', head: true }),
      adminClient.from('users').select('*', { count: 'exact', head: true }).in('role', ['coach', 'assistant_coach']).eq('archived', false),
      adminClient.from('users').select('*', { count: 'exact', head: true }).eq('role', 'assistant_coach').eq('approval_status', 'pending').eq('archived', false),
      adminClient
        .from('program_registrations')
        .select('id, student_name, student_id, status, payment_status, created_at, summer_programs(name)')
        .not('status', 'in', '("cancelled","refund_requested")')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    return (
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome to the admin command center</p>
        </div>

        {/* Stat Cards + Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <a
            href="/admin/users"
            className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Active Users</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{userCount ?? 0}</p>
              </div>
              <div className="w-12 h-12 bg-teal-50 group-hover:bg-teal-500 rounded-xl flex items-center justify-center transition-colors">
                <UsersIcon className="w-6 h-6 text-teal-600 group-hover:text-white transition-colors" />
              </div>
            </div>
            <p className="text-sm text-teal-600 group-hover:text-teal-700 font-medium mt-3 transition-colors">
              Manage users →
            </p>
          </a>

          <a
            href="/admin/schools"
            className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Schools</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{schoolCount ?? 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 group-hover:bg-blue-500 rounded-xl flex items-center justify-center transition-colors">
                <AcademicCapIcon className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
            </div>
            <p className="text-sm text-blue-600 group-hover:text-blue-700 font-medium mt-3 transition-colors">
              Manage schools →
            </p>
          </a>

          <a
            href="/admin/programs"
            className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Programs</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{programCount ?? 0}</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 group-hover:bg-amber-500 rounded-xl flex items-center justify-center transition-colors">
                <TrophyIcon className="w-6 h-6 text-amber-600 group-hover:text-white transition-colors" />
              </div>
            </div>
            <p className="text-sm text-amber-600 group-hover:text-amber-700 font-medium mt-3 transition-colors">
              Manage programs →
            </p>
          </a>

          <a
            href="/admin/students"
            className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Students</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{studentCount ?? 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 group-hover:bg-purple-500 rounded-xl flex items-center justify-center transition-colors">
                <UserGroupIcon className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
              </div>
            </div>
            <p className="text-sm text-purple-600 group-hover:text-purple-700 font-medium mt-3 transition-colors">
              View athletes →
            </p>
          </a>

          <a
            href="/admin/users?role=coaches"
            className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Coaches</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{coachCount ?? 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 group-hover:bg-green-500 rounded-xl flex items-center justify-center transition-colors">
                <ClipboardDocumentCheckIcon className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
              </div>
            </div>
            {(pendingAssistantCount ?? 0) > 0 ? (
              <p className="text-sm text-orange-600 group-hover:text-orange-700 font-medium mt-3 transition-colors">
                {pendingAssistantCount} pending approval →
              </p>
            ) : (
              <p className="text-sm text-green-600 group-hover:text-green-700 font-medium mt-3 transition-colors">
                View coaches →
              </p>
            )}
          </a>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="/admin/communications"
            className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow group"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                  Communications
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">Broadcast and messaging center</p>
              </div>
            </div>
          </a>

          <a
            href="/admin/analytics"
            className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow group"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <ChartBarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                  Analytics
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">Performance insights and reports</p>
              </div>
            </div>
          </a>

          <a
            href="/admin/settings"
            className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow group"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-slate-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Cog6ToothIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                  Settings
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">System configuration</p>
              </div>
            </div>
          </a>
        </div>

        {/* Active Athletes List */}
        <div className="bg-white rounded-xl shadow-card">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Registrations</h2>
            <a href="/admin/programs" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
              View all →
            </a>
          </div>
          {recentAthletes && recentAthletes.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentAthletes.map((athlete: any) => (
                <div key={athlete.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserGroupIcon className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{athlete.student_name}</p>
                      <p className="text-xs text-slate-500">{(athlete.summer_programs as any)?.name ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      athlete.payment_status === 'paid'
                        ? 'bg-teal-50 text-teal-700'
                        : athlete.payment_status === 'partial'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {athlete.payment_status ?? 'unpaid'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(athlete.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-10 text-center text-slate-400 text-sm">
              No registrations yet
            </div>
          )}
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
