import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CertificationTypeForm from '@/components/admin/CertificationTypeForm';

export default async function NewCertificationTypePage() {
  try {
    await requireRole('admin');

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b-2 border-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-4">
                <a href="/admin/certification-types" className="text-blue-600 hover:text-blue-800">
                  &larr; Back to Certification Types
                </a>
                <h1 className="text-xl font-bold text-gray-800">
                  Create Global Certification Type
                </h1>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                New Certification Type
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Create a global certification type that will be available to all schools.
              </p>
            </div>

            <CertificationTypeForm
              isSchoolAdmin={false}
              returnUrl="/admin/certification-types"
            />
          </div>
        </main>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
