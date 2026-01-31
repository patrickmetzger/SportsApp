import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PUT - Update a notification schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { days_before_expiry, notification_type, is_active } = body;

    const updateData: Record<string, unknown> = {};
    if (days_before_expiry !== undefined) updateData.days_before_expiry = days_before_expiry;
    if (notification_type !== undefined) updateData.notification_type = notification_type;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
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

// DELETE - Delete a notification schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
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
