import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SchoolAdminCreateUserForm from '@/components/school-admin/SchoolAdminCreateUserForm';

export default async function SchoolAdminNewUserPage() {
  try {
    await requireRole('school_admin');
    const supabase = await createClient();

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = await getEffectiveUserId();

    const { data: userData } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!userData?.school_id) {
      redirect('/school-admin');
    }

    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <a href="/school-admin/users" className="text-green-600 hover:text-green-800">
              ← Back to Users
            </a>
            <h1 className="text-2xl font-bold text-gray-800 mt-2">Create New User</h1>
          </div>
          <SchoolAdminCreateUserForm schoolId={userData.school_id} />
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
