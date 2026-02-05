import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AssistantAttendanceList from '@/components/assistant/AssistantAttendanceList';

export default async function AssistantAttendancePage() {
  try {
    await requireRole('assistant_coach');
    const supabase = await createClient();

    const effectiveUserId = await getEffectiveUserId();

    if (!effectiveUserId) {
      redirect('/login');
    }

    // Check approval status - redirect pending users
    const { data: userData } = await supabase
      .from('users')
      .select('approval_status')
      .eq('id', effectiveUserId)
      .single();

    if (userData?.approval_status !== 'approved') {
      redirect('/dashboard/assistant/pending');
    }

    // Fetch assigned coaches
    const { data: coachAssignments } = await supabase
      .from('coach_assistants')
      .select('coach_id')
      .eq('assistant_id', effectiveUserId);

    const coachIds = coachAssignments?.map(ca => ca.coach_id) || [];

    if (coachIds.length === 0) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Daily Attendance</h1>
            <p className="text-slate-500 mt-1">Track attendance for your assigned programs.</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <div className="text-yellow-600 text-4xl mb-3">!</div>
            <h3 className="font-semibold text-yellow-800 mb-2">No Coaches Assigned</h3>
            <p className="text-sm text-yellow-700">
              You need to be assigned to a coach before you can take attendance.
            </p>
          </div>
        </div>
      );
    }

    // Fetch active programs from assigned coaches
    const today = new Date().toISOString().split('T')[0];
    const { data: programsData } = await supabase
      .from('program_coaches')
      .select(`
        program_id,
        coach_id,
        coach:coach_id (first_name, last_name),
        summer_programs (
          id,
          name,
          description,
          start_date,
          end_date,
          cost
        )
      `)
      .in('coach_id', coachIds);

    // Extract programs and filter for active ones
    const allPrograms = programsData?.map(pc => ({
      ...pc.summer_programs,
      coach_id: pc.coach_id,
      coach_name: pc.coach ? `${(pc.coach as any).first_name} ${(pc.coach as any).last_name}` : 'Unknown'
    })).filter(Boolean) || [];

    const activePrograms = allPrograms.filter((p: any) => {
      return p.start_date <= today && p.end_date >= today;
    });

    // For each active program, get registration count
    const programsWithCounts = await Promise.all(
      activePrograms.map(async (program: any) => {
        const { count } = await supabase
          .from('program_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('program_id', program.id);

        return {
          ...program,
          student_count: count || 0
        };
      })
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Daily Attendance</h1>
            <p className="text-slate-500 mt-1">Track attendance for your assigned programs. Click on a program to take or view attendance.</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
        </div>

        <AssistantAttendanceList programs={programsWithCounts} assistantId={effectiveUserId} />
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
