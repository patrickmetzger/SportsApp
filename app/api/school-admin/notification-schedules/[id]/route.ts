import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getUserRole, getEffectiveUserId } from '@/lib/auth';

// PUT - Update a school-specific notification schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeRole = await getUserRole();
    if (activeRole !== 'school_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const effectiveUserId = await getEffectiveUserId();
    const client = createAdminClient();

    const { data: userData } = await client
      .from('users')
      .select('school_id')
      .eq('id', effectiveUserId!)
      .single();

    if (!userData?.school_id) {
      return NextResponse.json({ error: 'No school assigned' }, { status: 400 });
    }

    // Verify the schedule belongs to this school (not a global one)
    const { data: schedule } = await client
      .from('certification_notification_schedules')
      .select('school_id')
      .eq('id', id)
      .single();

    if (!schedule || schedule.school_id !== userData.school_id) {
      return NextResponse.json({ error: 'Cannot modify this schedule' }, { status: 403 });
    }

    const body = await request.json();
    const { days_before_expiry, notification_type, is_active, cc_emails } = body;

    const updateData: Record<string, unknown> = {};
    if (days_before_expiry !== undefined) updateData.days_before_expiry = days_before_expiry;
    if (notification_type !== undefined) updateData.notification_type = notification_type;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (cc_emails !== undefined) updateData.cc_emails = cc_emails && cc_emails.length > 0 ? cc_emails : null;

    const { data, error } = await client
      .from('certification_notification_schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, schedule: data });
  } catch (error: unknown) {
    console.error('Error updating schedule:', error);
    const message = error instanceof Error ? error.message : 'Failed to update schedule';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE - Delete a school-specific notification schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeRole = await getUserRole();
    if (activeRole !== 'school_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const effectiveUserId = await getEffectiveUserId();
    const client = createAdminClient();

    const { data: userData } = await client
      .from('users')
      .select('school_id')
      .eq('id', effectiveUserId!)
      .single();

    if (!userData?.school_id) {
      return NextResponse.json({ error: 'No school assigned' }, { status: 400 });
    }

    // Verify the schedule belongs to this school (not a global one)
    const { data: schedule } = await client
      .from('certification_notification_schedules')
      .select('school_id')
      .eq('id', id)
      .single();

    if (!schedule || schedule.school_id !== userData.school_id) {
      return NextResponse.json({ error: 'Cannot delete this schedule' }, { status: 403 });
    }

    const { error } = await client
      .from('certification_notification_schedules')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting schedule:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete schedule';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
