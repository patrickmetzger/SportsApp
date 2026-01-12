import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EditProgramClient from './EditProgramClient';

export default async function EditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('admin');
    const { id } = await params;
    const supabase = await createClient();

    // Fetch program
    const { data: program, error } = await supabase
      .from('summer_programs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !program) {
      redirect('/admin/programs');
    }

    // Fetch associated coaches
    const { data: coaches } = await supabase
      .from('program_coaches')
      .select('coach_id, role')
      .eq('program_id', id);

    // Add coaches to program object
    const programWithCoaches = {
      ...program,
      program_coaches: coaches || [],
    };

    return <EditProgramClient program={programWithCoaches} />;
  } catch (error) {
    redirect('/login');
  }
}
