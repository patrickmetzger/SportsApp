import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SchoolAdminEditUserForm from '@/components/school-admin/SchoolAdminEditUserForm';

export default async function SchoolAdminEditUserPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('school_admin');
    const supabase = await createClient();

    const { id } = await params;

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = await getEffectiveUserId();

    const { data: currentUserData } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!currentUserData?.school_id) {
      redirect('/school-admin');
    }

    // Fetch the user to edit
    const { data: userToEdit, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('school_id', currentUserData.school_id) // Security: only same school
      .single();

    if (error || !userToEdit) {
      redirect('/school-admin/users');
    }

    // Ensure user is allowed to edit this role
    if (!['coach', 'parent', 'school_admin'].includes(userToEdit.role)) {
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
          <SchoolAdminEditUserForm user={userToEdit} schoolId={currentUserData.school_id} />
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
