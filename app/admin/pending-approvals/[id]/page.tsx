import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import AdminPendingApprovalDetail from '@/components/admin/AdminPendingApprovalDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminPendingApprovalDetailPage({ params }: PageProps) {
  try {
    await requireRole('admin');
    const { id } = await params;
    const supabase = await createClient();

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
        school:school_id(id, name)
      `)
      .eq('id', id)
      .eq('role', 'assistant_coach')
      .single();

    if (error || !assistant) {
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
    const school = Array.isArray(assistant.school) ? assistant.school[0] : assistant.school;

    const assistantWithDetails = {
      ...assistant,
      school_name: school?.name || 'Unknown School',
      certifications: certifications || [],
      invited_by_coach: coachObj || null,
      invited_at: coachAssignment?.created_at || null,
    };

    return (
      <div className="space-y-6">
        {/* Back Link */}
        <div>
          <a
            href="/admin/pending-approvals"
            className="text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Pending Approvals
          </a>
        </div>

        {/* Detail Component */}
        <AdminPendingApprovalDetail assistant={assistantWithDetails} />
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
