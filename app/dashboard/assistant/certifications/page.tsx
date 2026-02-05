import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AssistantCertificationsList from '@/components/assistant/AssistantCertificationsList';

export default async function AssistantCertificationsPage() {
  try {
    await requireRole('assistant_coach');
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId();

    // Get assistant's certifications
    const { data: certifications, error } = await supabase
      .from('coach_certifications')
      .select(`
        *,
        certification_type:certification_types(*)
      `)
      .eq('coach_id', effectiveUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching certifications:', error);
    }

    // Get user's approval status
    const { data: userData } = await supabase
      .from('users')
      .select('approval_status')
      .eq('id', effectiveUserId)
      .single();

    const isPending = userData?.approval_status === 'pending';

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Certifications</h1>
            <p className="text-gray-600 mt-1">
              {isPending
                ? 'Upload your certifications to help expedite your approval'
                : 'Manage your coaching certifications and credentials'
              }
            </p>
          </div>
          <a
            href="/dashboard/assistant/certifications/upload"
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Certification
          </a>
        </div>

        {/* Pending Notice */}
        {isPending && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-medium text-amber-800">Your account is pending approval</p>
                <p className="text-sm text-amber-700 mt-1">
                  Upload your certifications here. School administrators will review them as part of your approval process.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Certifications List */}
        <AssistantCertificationsList certifications={certifications || []} />
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
