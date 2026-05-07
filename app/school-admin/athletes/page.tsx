import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import AthletesList from '@/components/athletes/AthletesList';

export default async function SchoolAdminAthletesPage() {
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

    // Get all program IDs for this school first, then fetch registrations
    const { data: programs } = await adminClient
      .from('summer_programs')
      .select('id, name')
      .eq('school_id', userData.school_id);

    const programIds = (programs ?? []).map((p) => p.id);

    const { data: athletes, error } = programIds.length > 0
      ? await adminClient
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
              name
            )
          `)
          .in('program_id', programIds)
          .order('created_at', { ascending: false })
      : { data: [], error: null };

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
          <p className="text-slate-500 mt-1">Registered athletes across all programs at your school</p>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          <AthletesList athletes={visibleAthletes} showSchool={false} />
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
