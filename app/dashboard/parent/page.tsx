import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
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
          end_date
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

    // Calculate payment summary
    const paymentSummary = {
      totalDue: registrations?.reduce((sum, reg) => sum + (Number(reg.amount_due) || 0), 0) || 0,
      totalPaid: registrations?.reduce((sum, reg) => sum + (Number(reg.amount_paid) || 0), 0) || 0,
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

        <ParentDashboardClient
          initialRegistrations={registrations || []}
          initialChildren={children || []}
          paymentSummary={paymentSummary}
        />
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
