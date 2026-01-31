import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CertificationUpload from '@/components/coach/CertificationUpload';

export default async function UploadCertificationPage() {
  try {
    await requireRole('coach');
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId();

    // Get user's school_id for school-specific types
    const { data: userData } = await supabase
      .from('users')
      .select('school_id')
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

    return (
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <a href="/dashboard/coach/certifications" className="text-teal-600 hover:text-teal-700">
            &larr; Back to Certifications
          </a>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Upload Certification</h1>
          <p className="text-gray-600 mt-1">
            Add a new certification to your profile. You can take a photo or upload a file.
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <CertificationUpload certificationTypes={certificationTypes || []} />
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
