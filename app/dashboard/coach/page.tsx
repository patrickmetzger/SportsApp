import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import CoachProgramsList from '@/components/coach/CoachProgramsList';
import CertificationStatusAlert from '@/components/coach/CertificationStatusAlert';
import CertificationNotificationTrigger from '@/components/coach/CertificationNotificationTrigger';
import {
  CalendarIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';


export default async function CoachDashboard() {
  try {
    await requireRole('coach');
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const effectiveUserId = await getEffectiveUserId();

    const { data: userData } = await supabase
      .from('users')
      .select('first_name')
      .eq('id', effectiveUserId)
      .single();

    // Fetch assigned programs
    const { data: assignedData } = await adminClient
      .from('program_coaches')
      .select(`
        program_id,
        summer_programs (
          id, name, description, start_date, end_date,
          registration_deadline, cost, header_image_url,
          status, rejection_reason, submitted_by
        )
      `)
      .eq('coach_id', effectiveUserId);

    // Fetch submitted programs (catches pending/rejected not yet in program_coaches)
    const { data: submittedData } = await adminClient
      .from('summer_programs')
      .select('id, name, description, start_date, end_date, registration_deadline, cost, header_image_url, status, rejection_reason, submitted_by')
      .eq('submitted_by', effectiveUserId);

    // Merge — submitted version takes priority
    const assignedPrograms = (assignedData?.map(pc => pc.summer_programs).filter(Boolean) || []) as any[];
    const submittedPrograms = submittedData || [];
    const submittedIds = new Set(submittedPrograms.map((p: any) => p.id));
    const allPrograms: any[] = [
      ...submittedPrograms,
      ...assignedPrograms.filter((p: any) => !submittedIds.has(p.id)),
    ];

    const now = new Date();

    // Required tasks: rejected programs needing action
    const rejectedPrograms = allPrograms.filter((p: any) => p.status === 'rejected');

    // Live programs: approved and currently running
    const livePrograms = allPrograms
      .filter((p: any) => {
        if (p.status !== 'approved') return false;
        const start = new Date(p.start_date);
        const end = new Date(p.end_date);
        return now >= start && now <= end;
      });

    // Upcoming programs: approved and not yet started, sorted soonest first
    const upcomingPrograms = allPrograms
      .filter((p: any) => {
        if (p.status !== 'approved') return false;
        return now < new Date(p.start_date);
      })
      .sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    return (
      <div className="space-y-8">
        <CertificationNotificationTrigger />

        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back{userData?.first_name ? `, ${userData.first_name}` : ''}
          </h1>
          <p className="text-slate-500 mt-1">Here's what needs your attention today.</p>
        </div>

        {/* Required Tasks */}
        {(rejectedPrograms.length > 0) && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
              Action Required
            </h2>
            <div className="space-y-3">
              {rejectedPrograms.map((p: any) => (
                <div key={p.id} className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-red-900">{p.name}</p>
                    {p.rejection_reason && (
                      <p className="text-sm text-red-700 mt-0.5">{p.rejection_reason}</p>
                    )}
                  </div>
                  <a
                    href={`/dashboard/coach/programs/${p.id}/edit`}
                    className="flex-shrink-0 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Edit & Resubmit
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certification alerts */}
        <CertificationStatusAlert />

        {/* Live Programs */}
        {livePrograms.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse inline-block" />
                Live Now
              </h2>
            </div>
            <CoachProgramsList programs={livePrograms} />
          </div>
        )}

        {/* Upcoming Programs */}
        {upcomingPrograms.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Upcoming</h2>
              <a
                href="/dashboard/coach/programs/new"
                className="px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors"
              >
                + Submit Program
              </a>
            </div>
            <CoachProgramsList programs={upcomingPrograms} />
          </div>
        )}

        {/* Empty state — no live or upcoming programs */}
        {livePrograms.length === 0 && upcomingPrograms.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-card">
            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ClipboardDocumentListIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No active or upcoming programs</h3>
            <p className="text-sm text-slate-500 mb-6">Submit a new program to get started.</p>
            <a
              href="/dashboard/coach/programs/new"
              className="inline-block px-6 py-2.5 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors"
            >
              + Submit Program
            </a>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
  } catch (error: any) {
    if (error?.digest?.startsWith?.('NEXT_REDIRECT')) throw error;
    redirect('/login');
  }
}
