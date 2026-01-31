import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CoachCertificationsList from '@/components/admin/CoachCertificationsList';

export default async function SchoolAdminCoachCertificationsPage() {
  try {
    await requireRole('school_admin');

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
                  Coach Certifications
                </h1>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                School Coach Certifications
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                View and monitor certification status for coaches at your school
              </p>
            </div>

            <CoachCertificationsList isSchoolAdmin={true} />
          </div>
        </main>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
