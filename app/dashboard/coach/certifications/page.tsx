import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CertificationsList from '@/components/coach/CertificationsList';

export default async function CoachCertificationsPage() {
  try {
    await requireRole('coach');
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId();

    // Get coach's certifications
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

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Certifications</h1>
            <p className="text-gray-600 mt-1">Manage your coaching certifications and credentials</p>
          </div>
          <a
            href="/dashboard/coach/certifications/upload"
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Certification
          </a>
        </div>

        {/* Certifications List */}
        <CertificationsList certifications={certifications || []} />
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
