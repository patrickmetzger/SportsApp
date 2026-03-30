import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import SchoolAdminEditUserForm from '@/components/school-admin/SchoolAdminEditUserForm';

export default async function SchoolAdminEditUserPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['school_admin', 'admin']);
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { id } = await params;

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = await getEffectiveUserId();

    // Use adminClient to handle impersonation
    const { data: currentUserData } = await adminClient
      .from('users')
      .select('school_id, role')
      .eq('id', effectiveUserId)
      .single();

    const isAdmin = currentUserData?.role === 'admin';

    if (!currentUserData || (!isAdmin && !currentUserData.school_id)) {
      redirect('/school-admin');
    }

    // Fetch the user to edit - admins can edit any user, school admins only their school
    let query = adminClient
      .from('users')
      .select('*')
      .eq('id', id);

    if (!isAdmin && currentUserData.school_id) {
      query = query.eq('school_id', currentUserData.school_id);
    }

    const { data: userToEdit, error } = await query.single();

    if (error || !userToEdit) {
      redirect('/school-admin/users');
    }

    // Ensure user is allowed to edit this role
    if (!['coach', 'assistant_coach', 'parent', 'school_admin'].includes(userToEdit.role)) {
      redirect('/school-admin/users');
    }

    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <a href="/school-admin/users" className="text-green-600 hover:text-green-800">
              ← Back to Users
            </a>
            <h1 className="text-2xl font-bold text-gray-800 mt-2">Edit User</h1>
          </div>
          <SchoolAdminEditUserForm user={userToEdit} schoolId={userToEdit.school_id || currentUserData.school_id || ''} />
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
