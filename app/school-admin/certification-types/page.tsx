import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CertificationTypesList from '@/components/admin/CertificationTypesList';

export default async function SchoolAdminCertificationTypesPage() {
  try {
    await requireRole('school_admin');
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId();

    // Get user's school_id
    const { data: userData } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!userData?.school_id) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">No School Assigned</h1>
            <p className="text-gray-600 mt-2">Please contact an administrator to assign you to a school.</p>
          </div>
        </div>
      );
    }

    // Get global and school-specific certification types
    const { data: certificationTypes, error } = await supabase
      .from('certification_types')
      .select(`
        *,
        school:schools(id, name)
      `)
      .or(`school_id.is.null,school_id.eq.${userData.school_id}`)
      .order('name');

    if (error) {
      console.error('Error fetching certification types:', error);
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b-2 border-teal-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-4">
                <a href="/school-admin" className="text-teal-600 hover:text-teal-800">
                  &larr; Back to Dashboard
                </a>
                <h1 className="text-xl font-bold text-gray-800">
                  Certification Types
                </h1>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Certification Types
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Global types are read-only. You can create and manage school-specific types.
                </p>
              </div>
              <a
                href="/school-admin/certification-types/new"
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition"
              >
                + Create School Type
              </a>
            </div>

            <CertificationTypesList
              certificationTypes={certificationTypes || []}
              isSchoolAdmin={true}
              schoolId={userData.school_id}
            />
          </div>
        </main>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
