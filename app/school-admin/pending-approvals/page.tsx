import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PendingApprovalsList from '@/components/school-admin/PendingApprovalsList';
import PendingProgramsList from '@/components/school-admin/PendingProgramsList';

export default async function PendingApprovalsPage() {
  try {
    await requireRole('school_admin');
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId();

    // Get admin's school
    const { data: adminData } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!adminData?.school_id) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No school assigned to your account.</p>
        </div>
      );
    }

    // Get pending assistant coaches
    const { data: pendingAssistants, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        approval_status,
        created_at
      `)
      .eq('school_id', adminData.school_id)
      .eq('role', 'assistant_coach')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending assistants:', error);
    }

    // Fetch pending programs for this school
    const { data: pendingPrograms, error: programError } = await supabase
      .from('summer_programs')
      .select('id, name, start_date, end_date, cost, submitted_by, created_at')
      .eq('school_id', adminData.school_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (programError) {
      console.error('Error fetching pending programs:', programError);
    }

    // Enrich programs with coach name
    const programsWithCoach = await Promise.all(
      (pendingPrograms || []).map(async (program) => {
        if (!program.submitted_by) {
          return { ...program, submitted_by_name: 'Unknown' };
        }
        const { data: coachData } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', program.submitted_by)
          .single();

        return {
          ...program,
          submitted_by_name: coachData
            ? `${coachData.first_name || ''} ${coachData.last_name || ''}`.trim()
            : 'Unknown',
        };
      })
    );

    // Get certification counts and coach info for each
    const assistantsWithDetails = await Promise.all(
      (pendingAssistants || []).map(async (assistant) => {
        const [certResult, coachResult] = await Promise.all([
          supabase
            .from('coach_certifications')
            .select('*', { count: 'exact', head: true })
            .eq('coach_id', assistant.id),
          supabase
            .from('coach_assistants')
            .select(`
              coach:coach_id(
                first_name,
                last_name
              )
            `)
            .eq('assistant_id', assistant.id)
            .single(),
        ]);

        const coach = coachResult.data?.coach;
        const coachObj = Array.isArray(coach) ? coach[0] : coach;

        return {
          ...assistant,
          certification_count: certResult.count || 0,
          invited_by: coachObj
            ? `${coachObj.first_name || ''} ${coachObj.last_name || ''}`.trim()
            : null,
        };
      })
    );

    const totalPending = assistantsWithDetails.length + programsWithCoach.length;

    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="text-gray-600 mt-1">
            Review and approve program submissions and assistant coach applications
          </p>
        </div>

        {/* Stats */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-amber-800">
                {totalPending} Pending Approval{totalPending !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-amber-700">
                {programsWithCoach.length} program{programsWithCoach.length !== 1 ? 's' : ''},{' '}
                {assistantsWithDetails.length} assistant coach{assistantsWithDetails.length !== 1 ? 'es' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Programs */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Program Submissions</h2>
          <PendingProgramsList programs={programsWithCoach} />
        </div>

        {/* Pending Assistant Coaches */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assistant Coach Applications</h2>
          <PendingApprovalsList pendingAssistants={assistantsWithDetails} />
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
