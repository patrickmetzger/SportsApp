import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import IncidentReportForm from '@/components/coach/IncidentReportForm';

export default async function IncidentReportPage() {
  try {
    await requireRole('coach');
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId();

    // Get coach's programs with registered students
    const { data: programsData } = await supabase
      .from('program_coaches')
      .select(`
        program_id,
        summer_programs (
          id,
          name,
          school_id,
          schools:school_id (
            id,
            name
          ),
          program_registrations (
            id,
            student_name,
            student_id,
            parent_user_id,
            users:parent_user_id (
              id,
              first_name,
              last_name,
              email
            )
          )
        )
      `)
      .eq('coach_id', effectiveUserId);

    // Transform the data for the form
    const programs = programsData?.map((pc: any) => ({
      id: pc.summer_programs.id,
      name: pc.summer_programs.name,
      schoolId: pc.summer_programs.school_id,
      schoolName: pc.summer_programs.schools?.name,
      students: pc.summer_programs.program_registrations?.map((reg: any) => ({
        id: reg.id,
        name: reg.student_name,
        studentId: reg.student_id,
        parentId: reg.parent_user_id,
        parentName: reg.users ? `${reg.users.first_name} ${reg.users.last_name}` : null,
        parentEmail: reg.users?.email,
      })) || [],
    })) || [];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Report Incident</h1>
            <p className="text-slate-500 mt-1">Report an injury or emergency and notify relevant parties</p>
          </div>
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <IncidentReportForm programs={programs} />
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
