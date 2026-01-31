import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import EditCertificationClient from './EditCertificationClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCertificationPage({ params }: PageProps) {
  try {
    await requireRole('coach');
    const { id } = await params;
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId();

    // Get the certification
    const { data: certification, error } = await supabase
      .from('coach_certifications')
      .select(`
        *,
        certification_type:certification_types(*)
      `)
      .eq('id', id)
      .eq('coach_id', effectiveUserId)
      .single();

    if (error || !certification) {
      notFound();
    }

    return (
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <a href="/dashboard/coach/certifications" className="text-teal-600 hover:text-teal-700">
            &larr; Back to Certifications
          </a>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Edit Certification</h1>
          <p className="text-gray-600 mt-1">
            Update your {certification.certification_type?.name} certification details
          </p>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <EditCertificationClient certification={certification} />
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
