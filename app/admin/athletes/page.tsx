import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import AthletesList from '@/components/athletes/AthletesList';

export default async function AdminAthletesPage() {
  try {
    await requireRole('admin');
    const adminClient = createAdminClient();

    const { data: athletes, error } = await adminClient
      .from('program_registrations')
      .select(`
        id,
        student_name,
        student_id,
        parent_name,
        parent_email,
        parent_phone,
        status,
        payment_status,
        amount_due,
        amount_paid,
        created_at,
        parent_child_id,
        summer_programs (
          id,
          name,
          schools (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching athletes:', error);
    }

    // Filter out registrations from portal where the child was later removed
    const allAthletes = (athletes ?? []) as any[];
    const portalChildIds = [...new Set(allAthletes.filter(a => a.parent_child_id).map(a => a.parent_child_id as string))];
    let existingChildIds = new Set<string>();
    if (portalChildIds.length > 0) {
      const { data: existingChildren } = await adminClient
        .from('parent_children')
        .select('id')
        .in('id', portalChildIds);
      existingChildIds = new Set((existingChildren ?? []).map((c: any) => c.id));
    }
    const visibleAthletes = allAthletes.filter(a => !a.parent_child_id || existingChildIds.has(a.parent_child_id));

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Athletes</h1>
          <p className="text-slate-500 mt-1">All registered athletes across every school and program</p>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          <AthletesList athletes={visibleAthletes} showSchool />
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
