import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import SchoolAdminUsersClient from '@/components/school-admin/SchoolAdminUsersClient';

export default async function SchoolAdminUsersPage() {
  try {
    await requireRole('school_admin');
    const supabase = await createClient();
    // Use admin client to bypass RLS for fetching users
    const adminClient = createAdminClient();

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

    // Fetch users at this school (coaches, parents, other school admins, assistant coaches)
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
      .eq('school_id', userData.school_id)
      .in('role', ['coach', 'assistant_coach', 'parent', 'school_admin'])
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
    }

    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">User Management</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage coaches, parents, and school admins at your school
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="/school-admin/users/invite"
                className="school-btn-primary px-4 py-2 rounded-lg"
              >
                ✉ Invite User
              </a>
              <a
                href="/school-admin/users/new"
                className="school-btn-secondary px-4 py-2 rounded-lg"
              >
                + Create User
              </a>
            </div>
          </div>

          <div className="p-6">
            <SchoolAdminUsersClient initialUsers={users || []} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
