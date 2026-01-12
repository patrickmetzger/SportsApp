import { createClient } from '@/lib/supabase/server';
import ProgramGrid from '@/components/programs/ProgramGrid';

export default async function ProgramsPage() {
  const supabase = await createClient();

  const { data: programs, error } = await supabase
    .from('summer_programs')
    .select('*')
    .gte('registration_deadline', new Date().toISOString())
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching programs:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b-2 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-gray-800">Summer Programs</h1>
            <a href="/" className="text-blue-600 hover:text-blue-800">
              Home
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">
            Explore Our Summer Programs
          </h2>
          <p className="text-gray-600 mt-2">
            Register for exciting sports programs this summer
          </p>
        </div>

        {programs && programs.length > 0 ? (
          <ProgramGrid programs={programs} />
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">
              No programs available at this time
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
