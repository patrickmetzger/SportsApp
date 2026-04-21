import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CoachProgramForm from '@/components/coach/CoachProgramForm';

export default async function CoachNewProgramPage() {
  try {
    await requireRole('coach');
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId();

    const { data: userData } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!userData?.school_id) {
      redirect('/dashboard/coach');
    }

    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <a href="/dashboard/coach" className="text-teal-600 hover:text-teal-800">
              ← Back to Dashboard
            </a>
            <h1 className="text-2xl font-bold text-gray-800 mt-2">Submit a New Program</h1>
            <p className="text-gray-500 mt-1">
              Your program will be reviewed by your school administrator before going live.
            </p>
          </div>
          <CoachProgramForm mode="create" />
        </div>
      </div>
    );
  } catch {
    redirect('/login');
  }
}
