import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Suspense } from 'react';
import ParentDashboardClient from '@/components/parent/ParentDashboardClient';

export default async function ParentDashboard() {
  try {
    await requireRole('parent');
    const supabase = await createClient();

    const effectiveUserId = await getEffectiveUserId();

    // Fetch parent's registrations with program details and payment info
    const { data: registrations } = await supabase
      .from('program_registrations')
      .select(`
        *,
        summer_programs (
          id,
          name,
          start_date,
          end_date,
          header_image_url
        )
      `)
      .eq('parent_user_id', effectiveUserId)
      .order('created_at', { ascending: false });

    // Fetch parent's children
    const { data: children } = await supabase
      .from('parent_children')
      .select('*')
      .eq('parent_user_id', effectiveUserId)
      .order('created_at', { ascending: false });

    // Backfill parent_child_id for any registrations that predate migration 27.
    // Match by student_id first (exact), then by name (case-insensitive).
    const unlinked = (registrations || []).filter((r) => !r.parent_child_id);
    if (unlinked.length > 0 && (children || []).length > 0) {
      const adminClient = createAdminClient();
      for (const reg of unlinked) {
        const match =
          (children || []).find(
            (c) => c.student_id && c.student_id === reg.student_id
          ) ||
          (children || []).find(
            (c) =>
              `${c.first_name} ${c.last_name}`.trim().toLowerCase() ===
              reg.student_name?.trim().toLowerCase()
          );
        if (match) {
          await adminClient
            .from('program_registrations')
            .update({ parent_child_id: match.id })
            .eq('id', reg.id);
          reg.parent_child_id = match.id; // update in-memory so UI reflects it immediately
        }
      }
    }

    // Calculate payment summary — exclude cancelled/refunded registrations
    const activeRegistrations = registrations?.filter(
      (reg) => !['cancelled', 'refund_requested'].includes(reg.status)
    ) || [];
    const paymentSummary = {
      totalDue: activeRegistrations.reduce((sum, reg) => sum + (Number(reg.amount_due) || 0), 0),
      totalPaid: activeRegistrations.reduce((sum, reg) => sum + (Number(reg.amount_paid) || 0), 0),
      outstanding: 0,
    };
    paymentSummary.outstanding = paymentSummary.totalDue - paymentSummary.totalPaid;

    return (
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-slate-500 mt-1">Manage your registrations and children</p>
        </div>

        <Suspense fallback={null}>
          <ParentDashboardClient
            initialRegistrations={registrations || []}
            initialChildren={children || []}
            paymentSummary={paymentSummary}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
