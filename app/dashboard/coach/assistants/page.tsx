import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AssistantsList from '@/components/coach/AssistantsList';

export default async function CoachAssistantsPage() {
  try {
    await requireRole('coach');

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Assistants</h1>
          <p className="text-slate-500 mt-1">
            Assign assistant coaches to help you with attendance and program management.
          </p>
        </div>

        <AssistantsList />
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
