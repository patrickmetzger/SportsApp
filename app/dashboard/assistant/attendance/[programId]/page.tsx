import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AssistantTakeAttendanceForm from '@/components/assistant/AssistantTakeAttendanceForm';
import Link from 'next/link';

export default async function AssistantTakeAttendancePage({ params }: { params: Promise<{ programId: string }> }) {
  try {
    await requireRole('assistant_coach');
    const supabase = await createClient();

    const { programId } = await params;

    const effectiveUserId = await getEffectiveUserId();

    if (!effectiveUserId) {
      redirect('/login');
    }

    // Verify assistant is assigned to a coach who has this program
    const { data: coachAssignments } = await supabase
      .from('coach_assistants')
      .select('coach_id')
      .eq('assistant_id', effectiveUserId);

    const coachIds = coachAssignments?.map(ca => ca.coach_id) || [];

    if (coachIds.length === 0) {
      redirect('/dashboard/assistant/attendance');
    }

    // Check if any assigned coach has this program
    const { data: programCoach } = await supabase
      .from('program_coaches')
      .select('id, coach_id')
      .eq('program_id', programId)
      .in('coach_id', coachIds)
      .limit(1)
      .single();

    if (!programCoach) {
      redirect('/dashboard/assistant/attendance');
    }

    // Fetch program details
    const { data: program } = await supabase
      .from('summer_programs')
      .select('*')
      .eq('id', programId)
      .single();

    if (!program) {
      redirect('/dashboard/assistant/attendance');
    }

    // Fetch program registrations (students)
    const { data: registrations } = await supabase
      .from('program_registrations')
      .select('*')
      .eq('program_id', programId)
      .order('student_name');

    // Fetch today's attendance if already recorded
    const today = new Date().toISOString().split('T')[0];
    const { data: existingAttendance } = await supabase
      .from('program_attendance')
      .select('*')
      .eq('program_id', programId)
      .eq('attendance_date', today);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/dashboard/assistant/attendance"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                &larr; Back to Attendance
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{program.name}</h1>
            <p className="text-slate-500 mt-1">{program.description || 'Mark attendance for today\'s session'}</p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <AssistantTakeAttendanceForm
          programId={programId}
          assistantId={effectiveUserId}
          students={registrations || []}
          existingAttendance={existingAttendance || []}
          today={today}
        />
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
