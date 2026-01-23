import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CoachProgramsList from '@/components/coach/CoachProgramsList';
import {
  TrophyIcon,
  CheckCircleIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

export default async function CoachDashboard() {
  try {
    await requireRole('coach');
    const supabase = await createClient();

    const effectiveUserId = await getEffectiveUserId();

    // Fetch coach's info
    const { data: userData } = await supabase
      .from('users')
      .select('first_name')
      .eq('id', effectiveUserId)
      .single();

    // Fetch programs assigned to this coach
    const { data: programsData } = await supabase
      .from('program_coaches')
      .select(`
        program_id,
        summer_programs (
          id,
          name,
          description,
          start_date,
          end_date,
          registration_deadline,
          cost,
          header_image_url
        )
      `)
      .eq('coach_id', effectiveUserId);

    const programs = programsData?.map(pc => pc.summer_programs).filter(Boolean) || [];

    // Calculate program stats
    const now = new Date();
    const activePrograms = programs.filter((p: any) => {
      const start = new Date(p.start_date);
      const end = new Date(p.end_date);
      return now >= start && now <= end;
    }).length;

    const upcomingPrograms = programs.filter((p: any) => {
      const start = new Date(p.start_date);
      return now < start;
    }).length;

    return (
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back{userData?.first_name ? `, ${userData.first_name}` : ''}
          </h1>
          <p className="text-slate-500 mt-1">Manage your programs and athletes</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Programs</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{programs.length}</p>
              </div>
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
                <ClipboardDocumentListIcon className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Now</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{activePrograms}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Upcoming</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{upcomingPrograms}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* My Programs Section */}
        <div id="programs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Your Programs</h2>
            <span className="text-sm text-slate-500">
              {programs.length} {programs.length === 1 ? 'program' : 'programs'} assigned
            </span>
          </div>
          <CoachProgramsList programs={programs as any} />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <a
              href="/dashboard/coach/attendance"
              className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                    Take Attendance
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Mark daily attendance for active programs
                  </p>
                </div>
              </div>
            </a>

            <div className="bg-white rounded-xl p-6 shadow-card opacity-60">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <UsersIcon className="w-6 h-6 text-slate-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">Athletes</h3>
                  <p className="text-sm text-slate-500 mt-1">Manage athlete rosters</p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-card opacity-60">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CalendarIcon className="w-6 h-6 text-slate-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">Schedule</h3>
                  <p className="text-sm text-slate-500 mt-1">Manage practice schedules</p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-card opacity-60">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-slate-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">Messages</h3>
                  <p className="text-sm text-slate-500 mt-1">Communicate with parents</p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-card opacity-60">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ChartBarIcon className="w-6 h-6 text-slate-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">Reports</h3>
                  <p className="text-sm text-slate-500 mt-1">Generate program reports</p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
