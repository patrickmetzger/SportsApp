import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import StudentsList from '@/components/students/StudentsList';

export default async function SchoolAdminStudentsPage() {
  try {
    await requireRole('school_admin');
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const effectiveUserId = await getEffectiveUserId();

    const { data: userData } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!userData?.school_id) {
      redirect('/school-admin');
    }

    // Get parent user IDs associated with this school
    const { data: schoolParents } = await adminClient
      .from('users')
      .select('id')
      .eq('school_id', userData.school_id)
      .eq('role', 'parent');

    const parentIds = (schoolParents ?? []).map((p) => p.id);

    const { data: students, error } = parentIds.length > 0
      ? await adminClient
          .from('parent_children')
          .select(`
            id,
            first_name,
            last_name,
            student_id,
            date_of_birth,
            gender,
            grade,
            created_at,
            users!parent_user_id (
              id,
              first_name,
              last_name,
              email
            )
          `)
          .in('parent_user_id', parentIds)
          .order('created_at', { ascending: false })
      : { data: [], error: null };

    if (error) {
      console.error('Error fetching students:', error);
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-500 mt-1">Students at your school</p>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          <StudentsList students={(students as any) ?? []} showSchool={false} />
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
