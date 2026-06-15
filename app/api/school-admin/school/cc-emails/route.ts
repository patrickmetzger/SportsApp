import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserRole, getEffectiveUserId } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { notification_cc_emails } = body;

    if (!Array.isArray(notification_cc_emails)) {
      return NextResponse.json({ error: 'notification_cc_emails must be an array' }, { status: 400 });
    }

    const { error } = await client
      .from('schools')
      .update({ notification_cc_emails })
      .eq('id', userData.school_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error updating CC emails:', error);
    const message = error instanceof Error ? error.message : 'Failed to update CC emails';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
