import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AssistantProgramsList from '@/components/assistant/AssistantProgramsList';
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  CalendarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export default async function AssistantCoachDashboard() {
  try {
    await requireRole('assistant_coach');
    const supabase = await createClient();

    const effectiveUserId = await getEffectiveUserId();

    // Fetch assistant coach's info
    const { data: userData } = await supabase
      .from('users')
      .select('first_name')
      .eq('id', effectiveUserId)
      .single();

    // Fetch assigned coaches
    const { data: coachAssignments } = await supabase
      .from('coach_assistants')
      .select(`
        coach_id,
        coach:coach_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('assistant_id', effectiveUserId);

    // Handle the coach data - it could be an object or array from Supabase join
    const assignedCoaches = coachAssignments?.map(ca => {
      const coach = ca.coach;
      // Supabase sometimes returns joined data as array
      return Array.isArray(coach) ? coach[0] : coach;
    }).filter(Boolean) || [];
    const coachIds = assignedCoaches.map((c: any) => c.id);

    // Fetch programs from all assigned coaches
    let programs: any[] = [];
    if (coachIds.length > 0) {
      const { data: programsData } = await supabase
        .from('program_coaches')
        .select(`
          program_id,
          coach_id,
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
        .in('coach_id', coachIds);

      programs = programsData?.map(pc => ({
        ...pc.summer_programs,
        coach_id: pc.coach_id
      })).filter(Boolean) || [];
    }

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
          <p className="text-slate-500 mt-1">View programs and take attendance for your assigned coaches</p>
        </div>

        {/* Assigned Coaches */}
        {assignedCoaches.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Assigned Coaches</h2>
                <p className="text-sm text-slate-500">You assist {assignedCoaches.length} {assignedCoaches.length === 1 ? 'coach' : 'coaches'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {assignedCoaches.map((coach: any) => (
                <div
                  key={coach.id}
                  className="inline-flex items-center px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm"
                >
                  {coach.first_name} {coach.last_name}
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Programs Section */}
        <div id="programs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Programs</h2>
            <span className="text-sm text-slate-500">
              {programs.length} {programs.length === 1 ? 'program' : 'programs'} available
            </span>
          </div>
          <AssistantProgramsList programs={programs} coaches={assignedCoaches} />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a
              href="/dashboard/assistant/attendance"
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
                  <CalendarIcon className="w-6 h-6 text-slate-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">View Schedule</h3>
                  <p className="text-sm text-slate-500 mt-1">See upcoming sessions</p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Notice */}
        {assignedCoaches.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">No Coaches Assigned</h3>
            <p className="text-sm text-yellow-700">
              You haven&apos;t been assigned to any coaches yet. Please contact your school administrator
              or the coach you&apos;ll be assisting to get assigned.
            </p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
