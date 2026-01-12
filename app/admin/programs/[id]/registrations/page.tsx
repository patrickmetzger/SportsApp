import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ProgramRegistrationsClient from '@/components/admin/ProgramRegistrationsClient';

export default async function ProgramRegistrationsPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('admin');
    const { id } = await params;
    const supabase = await createClient();

    // Fetch program
    const { data: program, error: programError } = await supabase
      .from('summer_programs')
      .select('*')
      .eq('id', id)
      .single();

    if (programError || !program) {
      redirect('/admin/programs');
    }

    // Fetch all registrations for this program
    const { data: registrations } = await supabase
      .from('program_registrations')
      .select('*')
      .eq('program_id', id)
      .order('created_at', { ascending: false });

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link href="/admin/programs" className="text-blue-600 hover:text-blue-800">
                ← Back to Programs
              </Link>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProgramRegistrationsClient
            programId={id}
            programName={program.name}
            programCost={program.cost || 0}
            initialRegistrations={registrations || []}
          />
        </main>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
