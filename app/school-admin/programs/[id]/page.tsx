import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SchoolAdminProgramForm from '@/components/school-admin/SchoolAdminProgramForm';

export default async function SchoolAdminEditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('school_admin');
    const supabase = await createClient();

    const { id } = await params;

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = await getEffectiveUserId();

    const { data: userData } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!userData?.school_id) {
      redirect('/school-admin');
    }

    // Fetch the program to edit
    const { data: program, error } = await supabase
      .from('summer_programs')
      .select(`
        *,
        program_coaches (
          coach_id
        )
      `)
      .eq('id', id)
      .eq('school_id', userData.school_id) // Security: only same school
      .single();

    if (error || !program) {
      redirect('/school-admin/programs');
    }

    // Fetch coaches at this school for assignment
    const { data: coaches } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('role', 'coach')
      .eq('school_id', userData.school_id)
      .order('last_name');

    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <a href="/school-admin/programs" className="text-green-600 hover:text-green-800">
              ← Back to Programs
            </a>
            <h1 className="text-2xl font-bold text-gray-800 mt-2">Edit Program</h1>
          </div>
          <SchoolAdminProgramForm
            schoolId={userData.school_id}
            coaches={coaches || []}
            mode="edit"
            program={program}
          />
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
