import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import UsersPageClient from '@/components/admin/UsersPageClient';

export default async function UsersPage() {
  try {
    await requireRole('admin');
    // Use admin client to bypass RLS and see all users
    const adminClient = createAdminClient();

    // Fetch all users (excluding archived) with school information
    const { data: users, error } = await adminClient
      .from('users')
      .select(`
        *,
        school:school_id (
          id,
          name,
          city,
          state
        )
      `)
      .or('archived.eq.false,archived.is.null')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b-2 border-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-4">
                <a href="/admin" className="text-blue-600 hover:text-blue-800">
                  ← Back to Admin
                </a>
                <h1 className="text-xl font-bold text-gray-800">User Management</h1>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">All Users</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Click &quot;Impersonate&quot; to test the system as another user
                </p>
              </div>
              <div className="flex gap-3">
                <a
                  href="/admin/users/invite"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  ✉ Invite User
                </a>
                <a
                  href="/admin/users/new"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  + Create User
                </a>
              </div>
            </div>

            <div className="p-6">
              <UsersPageClient initialUsers={users || []} />
            </div>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
