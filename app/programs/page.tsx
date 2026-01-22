import { createClient } from '@/lib/supabase/server';
import ProgramGrid from '@/components/programs/ProgramGrid';
import { TrophyIcon } from '@heroicons/react/24/outline';

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
    <div className="min-h-screen bg-slate-100">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-navy-900 rounded-lg flex items-center justify-center">
                <span className="text-teal-400 font-bold text-lg">S</span>
              </div>
              <span className="font-semibold text-slate-900">SchoolSports</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="/" className="text-sm text-slate-600 hover:text-teal-600 transition-colors">
                Home
              </a>
              <a href="/login" className="text-sm bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors">
                Sign In
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Athletic Programs</h1>
          <p className="text-slate-500 mt-2">
            Discover exceptional opportunities to elevate your athletic journey this season.
          </p>
        </div>

        {programs && programs.length > 0 ? (
          <ProgramGrid programs={programs} />
        ) : (
          <div className="bg-white rounded-xl p-16 text-center shadow-card">
            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrophyIcon className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 text-lg">
              No programs currently available
            </p>
            <p className="text-slate-400 text-sm mt-2">
              Check back soon for upcoming athletic programs
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
