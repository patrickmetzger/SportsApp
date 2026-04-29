import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectiveUserId } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId();

    // Fetch the registration and verify ownership
    const adminClient = createAdminClient();
    const { data: registration, error: fetchError } = await adminClient
      .from('program_registrations')
      .select('id, status, payment_status, amount_paid, parent_user_id')
      .eq('id', id)
      .single();

    if (fetchError || !registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    if (registration.parent_user_id !== effectiveUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (['cancelled', 'refund_requested'].includes(registration.status)) {
      return NextResponse.json({ error: 'Registration is already cancelled or has a pending refund request' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    const amountPaid = Number(registration.amount_paid || 0);
    const isPaid = amountPaid > 0;

    const newStatus = isPaid ? 'refund_requested' : 'cancelled';

    const { error: updateError } = await adminClient
      .from('program_registrations')
      .update({
        status: newStatus,
        notes: isPaid
          ? `Refund requested. Reason: ${reason || 'No reason provided'}. Amount paid: $${amountPaid.toFixed(2)}`
          : 'Cancelled by parent',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error: any) {
    console.error('Cancel registration error:', error);
    return NextResponse.json({ error: error.message || 'Failed to cancel registration' }, { status: 500 });
  }
}
