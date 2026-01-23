import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CoachAttendanceList from '@/components/coach/CoachAttendanceList';

export default async function CoachAttendancePage() {
  try {
    await requireRole('coach');
    const supabase = await createClient();

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = await getEffectiveUserId();

    if (!effectiveUserId) {
      redirect('/login');
    }

    // Fetch active programs assigned to this coach
    const today = new Date().toISOString().split('T')[0];
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
          cost
        )
      `)
      .eq('coach_id', effectiveUserId);

    // Extract programs and filter for active ones
    const allPrograms = programsData?.map(pc => pc.summer_programs).filter(Boolean) || [];
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
            <p className="text-slate-500 mt-1">Track attendance for your active programs. Click on a program to take or view attendance.</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
        </div>

        <CoachAttendanceList programs={programsWithCounts} coachId={effectiveUserId} />
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
