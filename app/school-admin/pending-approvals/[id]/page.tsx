import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import PendingApprovalDetail from '@/components/school-admin/PendingApprovalDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PendingApprovalDetailPage({ params }: PageProps) {
  try {
    await requireRole('school_admin');
    const { id } = await params;
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId();

    // Get admin's school
    const { data: adminData } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!adminData?.school_id) {
      return notFound();
    }

    // Get the assistant details
    const { data: assistant, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        approval_status,
        rejected_reason,
        created_at,
        school_id
      `)
      .eq('id', id)
      .eq('role', 'assistant_coach')
      .single();

    if (error || !assistant) {
      return notFound();
    }

    // Verify they're from the same school
    if (assistant.school_id !== adminData.school_id) {
      return notFound();
    }

    // Get certifications
    const { data: certifications } = await supabase
      .from('coach_certifications')
      .select(`
        *,
        certification_type:certification_types(*)
      `)
      .eq('coach_id', id)
      .order('created_at', { ascending: false });

    // Get inviting coach
    const { data: coachAssignment } = await supabase
      .from('coach_assistants')
      .select(`
        created_at,
        coach:coach_id(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('assistant_id', id)
      .single();

    const coach = coachAssignment?.coach;
    const coachObj = Array.isArray(coach) ? coach[0] : coach;

    const assistantWithDetails = {
      ...assistant,
      certifications: certifications || [],
      invited_by_coach: coachObj || null,
      invited_at: coachAssignment?.created_at || null,
    };

    return (
      <div className="space-y-6">
        {/* Back Link */}
        <div>
          <a
            href="/school-admin/pending-approvals"
            className="text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Pending Approvals
          </a>
        </div>

        {/* Detail Component */}
        <PendingApprovalDetail assistant={assistantWithDetails} />
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
