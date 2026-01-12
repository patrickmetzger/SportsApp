import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SchoolAdminProgramsList from '@/components/school-admin/SchoolAdminProgramsList';

export default async function SchoolAdminProgramsPage() {
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

    const { data: programs, error } = await supabase
      .from('summer_programs')
      .select('*')
      .eq('school_id', userData.school_id)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching programs:', error);
    }

    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Program Management</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage summer programs for your school
              </p>
            </div>
            <a
              href="/school-admin/programs/new"
              className="school-btn-primary px-4 py-2 rounded-lg"
            >
              + Create Program
            </a>
          </div>

          <div className="p-6">
            <SchoolAdminProgramsList programs={programs || []} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
