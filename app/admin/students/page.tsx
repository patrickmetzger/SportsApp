import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import StudentsList from '@/components/students/StudentsList';

export default async function AdminStudentsPage() {
  try {
    await requireRole('admin');
    const adminClient = createAdminClient();

    const { data: students, error } = await adminClient
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
          email,
          schools:school_id (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching students:', error);
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-500 mt-1">All students in the system across every school</p>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          <StudentsList students={(students as any) ?? []} showSchool />
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
