import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AssistantCertificationUpload from '@/components/assistant/AssistantCertificationUpload';

export default async function UploadAssistantCertificationPage() {
  try {
    await requireRole('assistant_coach');
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId();

    // Get user's school_id for school-specific types
    const { data: userData } = await supabase
      .from('users')
      .select('school_id, approval_status')
      .eq('id', effectiveUserId)
      .single();

    // Get available certification types (global + school-specific)
    let query = supabase
      .from('certification_types')
      .select('id, name, description, validity_period_months')
      .order('name');

    if (userData?.school_id) {
      query = query.or(`school_id.is.null,school_id.eq.${userData.school_id}`);
    } else {
      query = query.is('school_id', null);
    }

    const { data: certificationTypes, error } = await query;

    if (error) {
      console.error('Error fetching certification types:', error);
    }

    const isPending = userData?.approval_status === 'pending';

    return (
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <a href="/dashboard/assistant/certifications" className="text-teal-600 hover:text-teal-700">
            &larr; Back to Certifications
          </a>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Upload Certification</h1>
          <p className="text-gray-600 mt-1">
            {isPending
              ? 'Upload your certifications to help expedite your approval process.'
              : 'Add a new certification to your profile. You can take a photo or upload a file.'
            }
          </p>
        </div>

        {/* Pending Notice */}
        {isPending && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-blue-800">Tip for faster approval</p>
                <p className="text-sm text-blue-700 mt-1">
                  Upload all required certifications that your school requires. School administrators
                  will review these as part of your approval process.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <AssistantCertificationUpload certificationTypes={certificationTypes || []} />
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
