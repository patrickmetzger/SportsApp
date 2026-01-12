import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CommunicationsList from '@/components/admin/CommunicationsList';

export default async function SchoolAdminCommunicationsPage() {
  try {
    await requireRole('school_admin');
    const supabase = await createClient();

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = await getEffectiveUserId();

    // Get the school admin's school
    const { data: userData } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!userData?.school_id) {
      redirect('/school-admin');
    }

    // Fetch communications for this school only
    const { data: communications, error } = await supabase
      .from('communications')
      .select(`
        *,
        sender:sender_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('school_id', userData.school_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching communications:', error);
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b-2 border-green-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-4">
                <a href="/school-admin" className="text-green-600 hover:text-green-800">
                  ← Back to Dashboard
                </a>
                <h1 className="text-xl font-bold text-gray-800">Communications</h1>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Communication History</h2>
                <p className="text-sm text-gray-600 mt-1">
                  View all messages sent to coaches at your school
                </p>
              </div>
              <a
                href="/school-admin/communications/send"
                className="school-btn-primary px-4 py-2 rounded-lg"
              >
                + Send Communication
              </a>
            </div>

            <div className="p-6">
              <CommunicationsList communications={communications || []} />
            </div>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
