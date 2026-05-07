import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectiveUserId } from '@/lib/auth';

// Returns all active registrations for the logged-in parent, with program dates.
// Used by the registration form to detect schedule conflicts before submitting.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ registrations: [] });

    const effectiveUserId = await getEffectiveUserId();

    const adminClient = createAdminClient();
    const { data: registrations, error } = await adminClient
      .from('program_registrations')
      .select('id, parent_child_id, student_name, summer_programs(id, name, start_date, end_date)')
      .eq('parent_user_id', effectiveUserId)
      .not('status', 'in', '("cancelled","refund_requested")');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ registrations: registrations || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch registrations' }, { status: 500 });
  }
}
