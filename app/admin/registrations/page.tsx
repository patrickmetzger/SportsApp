import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import RegistrationsList from '@/components/admin/RegistrationsList';

export default async function AdminRegistrationsPage() {
  try {
    await requireRole('admin');
    const supabase = await createClient();

    const { data: registrations, error } = await supabase
      .from('program_registrations')
      .select(`
        *,
        summer_programs (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching registrations:', error);
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b-2 border-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-4">
                <a href="/admin" className="text-blue-600 hover:text-blue-800">
                  ← Back to Admin
                </a>
                <h1 className="text-xl font-bold text-gray-800">
                  Program Registrations
                </h1>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                All Registrations
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Review and manage program registrations
              </p>
            </div>

            <RegistrationsList registrations={registrations} />
          </div>
        </main>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
