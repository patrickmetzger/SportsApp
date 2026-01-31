import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CertificationTypesList from '@/components/admin/CertificationTypesList';

export default async function AdminCertificationTypesPage() {
  try {
    await requireRole('admin');
    const supabase = await createClient();

    const { data: certificationTypes, error } = await supabase
      .from('certification_types')
      .select(`
        *,
        school:schools(id, name)
      `)
      .order('name');

    if (error) {
      console.error('Error fetching certification types:', error);
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b-2 border-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-4">
                <a href="/admin" className="text-blue-600 hover:text-blue-800">
                  &larr; Back to Admin
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
                  All Certification Types
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage certification types that coaches need to upload
                </p>
              </div>
              <a
                href="/admin/certification-types/new"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                + Create Global Type
              </a>
            </div>

            <CertificationTypesList
              certificationTypes={certificationTypes || []}
              isSchoolAdmin={false}
            />
          </div>
        </main>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
