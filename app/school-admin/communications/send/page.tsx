import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SendCommunicationForm from '@/components/admin/SendCommunicationForm';

export default async function SchoolAdminSendCommunicationPage() {
  try {
    await requireRole('school_admin');
    const supabase = await createClient();

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = await getEffectiveUserId();

    if (!effectiveUserId) {
      redirect('/login');
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!userData || userData.role !== 'school_admin') {
      redirect('/login');
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b-2 border-green-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-4">
                <a href="/school-admin/communications" className="text-green-600 hover:text-green-800">
                  ← Back to Communications
                </a>
                <h1 className="text-xl font-bold text-gray-800">Send Communication</h1>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SendCommunicationForm
            currentUserRole={userData.role}
            currentUserSchoolId={userData.school_id}
          />
        </main>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
