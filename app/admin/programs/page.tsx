import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProgramsList from '@/components/admin/ProgramsList';

export default async function AdminProgramsPage() {
  try {
    await requireRole('admin');
    const supabase = await createClient();

    const { data: programs, error } = await supabase
      .from('summer_programs')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching programs:', error);
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b-2 border-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex min-h-16 py-3 items-center flex-wrap">
              <div className="flex items-center gap-4">
                <a href="/admin" className="text-blue-600 hover:text-blue-800">
                  ← Back to Admin
                </a>
                <h1 className="text-xl font-bold text-gray-800">
                  Program Management
                </h1>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  All Programs
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage summer program offerings
                </p>
              </div>
              <a
                href="/admin/programs/new"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shrink-0"
              >
                + Create Program
              </a>
            </div>

            <ProgramsList programs={programs} />
          </div>
        </main>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
