import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ParentCommunicationsClient from '@/components/parent/ParentCommunicationsClient';

export default async function ParentCommunicationsPage() {
  try {
    await requireRole('parent');
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId();

    // Get parent's registrations with program and coach info
    const { data: registrations } = await supabase
      .from('program_registrations')
      .select(`
        id,
        student_name,
        summer_programs (
          id,
          name,
          program_coaches (
            coach_id,
            users:coach_id (
              id,
              first_name,
              last_name,
              email
            )
          )
        )
      `)
      .eq('parent_user_id', effectiveUserId);

    // Extract unique coaches from registrations
    const coachesMap = new Map();
    registrations?.forEach((reg: any) => {
      const program = reg.summer_programs;
      if (program?.program_coaches) {
        program.program_coaches.forEach((pc: any) => {
          if (pc.users) {
            const coach = pc.users;
            if (!coachesMap.has(coach.id)) {
              coachesMap.set(coach.id, {
                ...coach,
                programs: [{ id: program.id, name: program.name, studentName: reg.student_name }],
              });
            } else {
              const existing = coachesMap.get(coach.id);
              existing.programs.push({ id: program.id, name: program.name, studentName: reg.student_name });
            }
          }
        });
      }
    });

    const coaches = Array.from(coachesMap.values());

    // Get sent messages
    const { data: sentMessages } = await supabase
      .from('communications')
      .select('*')
      .eq('sender_id', effectiveUserId)
      .order('created_at', { ascending: false })
      .limit(20);

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Communications</h1>
          <p className="text-slate-500 mt-1">Message coaches from your children's programs</p>
        </div>

        <ParentCommunicationsClient
          coaches={coaches}
          sentMessages={sentMessages || []}
        />
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
