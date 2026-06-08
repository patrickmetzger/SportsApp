import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import EditUserForm from '@/components/admin/EditUserForm';

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('admin');
    const supabase = await createClient();
    const { id } = await params;

    // Fetch the user to edit
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      redirect('/admin/users');
    }

    // Fetch user's additional roles from user_roles table
    const adminClient = createAdminClient();
    const { data: userRolesData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', id);

    const userRoles = userRolesData?.map((r) => r.role) || [user.role];

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-4">
                <a href="/admin/users" className="text-blue-600 hover:text-blue-800">
                  ← Back to Users
                </a>
                <h1 className="text-xl font-bold text-gray-800">Edit User</h1>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EditUserForm user={user} userRoles={userRoles} />
        </main>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
