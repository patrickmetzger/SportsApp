import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import CoachProgramEditForm from '@/components/coach/CoachProgramEditForm';

export default async function CoachEditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireRole('coach');
    const adminClient = createAdminClient();
    const effectiveUserId = await getEffectiveUserId();
    const { id } = await params;

    const { data: program } = await adminClient
      .from('summer_programs')
      .select('*')
      .eq('id', id)
      .single();

    if (!program) redirect('/dashboard/coach');

    // Allow editing if the coach submitted the program OR is assigned to it
    const isSubmitter = program.submitted_by === effectiveUserId;

    const { data: assignment } = await adminClient
      .from('program_coaches')
      .select('id')
      .eq('program_id', id)
      .eq('coach_id', effectiveUserId)
      .maybeSingle();

    if (!isSubmitter && !assignment) redirect('/dashboard/coach');

    const isRejected = program.status === 'rejected';

    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <a href="/dashboard/coach" className="text-teal-600 hover:text-teal-800">
              ← Back to Dashboard
            </a>
            <h1 className="text-2xl font-bold text-gray-800 mt-2">
              {isRejected ? 'Edit & Resubmit Program' : 'Edit Program'}
            </h1>
            {isRejected && program.rejection_reason && (
              <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">Rejection reason:</p>
                <p className="text-sm text-red-700 mt-1">{program.rejection_reason}</p>
              </div>
            )}
          </div>
          <CoachProgramEditForm program={program} coachId={effectiveUserId!} />
        </div>
      </div>
    );
  } catch {
    redirect('/login');
  }
}
