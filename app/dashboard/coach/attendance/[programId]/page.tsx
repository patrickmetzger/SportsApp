import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TakeAttendanceForm from '@/components/coach/TakeAttendanceForm';
import Link from 'next/link';

export default async function TakeAttendancePage({ params }: { params: Promise<{ programId: string }> }) {
  try {
    await requireRole('coach');
    const supabase = await createClient();

    const { programId } = await params;

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = await getEffectiveUserId();

    if (!effectiveUserId) {
      redirect('/login');
    }

    // Verify coach is assigned to this program
    const { data: coachAssignment } = await supabase
      .from('program_coaches')
      .select('id')
      .eq('coach_id', effectiveUserId)
      .eq('program_id', programId)
      .single();

    if (!coachAssignment) {
      redirect('/dashboard/coach/attendance');
    }

    // Fetch program details
    const { data: program } = await supabase
      .from('summer_programs')
      .select('*')
      .eq('id', programId)
      .single();

    if (!program) {
      redirect('/dashboard/coach/attendance');
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
                href="/dashboard/coach/attendance"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Back to Attendance
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

        <TakeAttendanceForm
          programId={programId}
          coachId={effectiveUserId}
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
