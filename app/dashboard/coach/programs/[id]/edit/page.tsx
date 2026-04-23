import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CoachProgramForm from '@/components/coach/CoachProgramForm';

export default async function CoachEditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireRole('coach');
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId();
    const { id } = await params;

    const { data: program } = await supabase
      .from('summer_programs')
      .select('*')
      .eq('id', id)
      .single();

    // Only allow editing if this coach submitted the program and it's pending/rejected
    if (
      !program ||
      program.submitted_by !== effectiveUserId ||
      !['pending', 'rejected'].includes(program.status)
    ) {
      redirect('/dashboard/coach');
    }

    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <a href="/dashboard/coach" className="text-teal-600 hover:text-teal-800">
              ← Back to Dashboard
            </a>
            <h1 className="text-2xl font-bold text-gray-800 mt-2">Edit & Resubmit Program</h1>
            {program.rejection_reason && (
              <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">Rejection reason:</p>
                <p className="text-sm text-red-700 mt-1">{program.rejection_reason}</p>
              </div>
            )}
          </div>
          <CoachProgramForm mode="edit" program={program} />
        </div>
      </div>
    );
  } catch {
    redirect('/login');
  }
}
