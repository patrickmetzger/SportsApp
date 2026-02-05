import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminPendingApprovalsList from '@/components/admin/AdminPendingApprovalsList';

export default async function AdminPendingApprovalsPage() {
  try {
    await requireRole('admin');
    const supabase = await createClient();

    // Get all pending assistant coaches across all schools
    const { data: pendingAssistants, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        approval_status,
        created_at,
        school:school_id(id, name)
      `)
      .eq('role', 'assistant_coach')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending assistants:', error);
    }

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
        const school = Array.isArray(assistant.school) ? assistant.school[0] : assistant.school;

        return {
          ...assistant,
          school_name: school?.name || 'Unknown School',
          certification_count: certResult.count || 0,
          invited_by: coachObj
            ? `${coachObj.first_name || ''} ${coachObj.last_name || ''}`.trim()
            : null,
        };
      })
    );

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="text-gray-600 mt-1">
            Review and approve assistant coach applications across all schools
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
                {assistantsWithDetails.length} Pending Approval{assistantsWithDetails.length !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-amber-700">
                Review certifications and approve assistant coaches
              </p>
            </div>
          </div>
        </div>

        {/* List */}
        <AdminPendingApprovalsList pendingAssistants={assistantsWithDetails} />
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
