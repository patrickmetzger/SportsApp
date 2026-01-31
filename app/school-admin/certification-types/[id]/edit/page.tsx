import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import CertificationTypeForm from '@/components/admin/CertificationTypeForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSchoolCertificationTypePage({ params }: PageProps) {
  try {
    await requireRole('school_admin');
    const { id } = await params;
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId();

    // Get user's school_id
    const { data: userData } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', effectiveUserId)
      .single();

    const { data: certificationType, error } = await supabase
      .from('certification_types')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !certificationType) {
      notFound();
    }

    // Verify this is a school-specific type from this school
    if (!certificationType.school_id || certificationType.school_id !== userData?.school_id) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">Access Denied</h1>
            <p className="text-gray-600 mt-2">You can only edit certification types specific to your school.</p>
            <a href="/school-admin/certification-types" className="text-teal-600 hover:underline mt-4 inline-block">
              Back to Certification Types
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b-2 border-teal-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-4">
                <a href="/school-admin/certification-types" className="text-teal-600 hover:text-teal-800">
                  &larr; Back to Certification Types
                </a>
                <h1 className="text-xl font-bold text-gray-800">
                  Edit Certification Type
                </h1>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Edit: {certificationType.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                School-specific certification type
              </p>
            </div>

            <CertificationTypeForm
              certificationType={certificationType}
              isSchoolAdmin={true}
              returnUrl="/school-admin/certification-types"
            />
          </div>
        </main>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
