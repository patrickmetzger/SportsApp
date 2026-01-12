import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SendCommunicationForm from '@/components/admin/SendCommunicationForm';

export default async function SendCommunicationPage() {
  try {
    // Allow both admin and school_admin to send communications
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (!userData || (userData.role !== 'admin' && userData.role !== 'school_admin')) {
      redirect('/login');
    }

    // If school_admin, redirect to school-admin path
    if (userData.role === 'school_admin') {
      redirect('/school-admin/communications/send');
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b-2 border-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-4">
                <a href="/admin/communications" className="text-blue-600 hover:text-blue-800">
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
