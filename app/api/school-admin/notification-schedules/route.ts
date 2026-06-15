import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserRole, getEffectiveUserId } from '@/lib/auth';

// GET - List notification schedules (global + school-specific)
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify user
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

    if (!userData) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!userData.school_id) {
      return NextResponse.json({ error: 'No school assigned' }, { status: 400 });
    }

    // Get global + school-specific schedules
    const { data, error } = await client
      .from('certification_notification_schedules')
      .select('*')
      .or(`school_id.is.null,school_id.eq.${userData.school_id}`)
      .order('days_before_expiry', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ schedules: data });
  } catch (error: unknown) {
    console.error('Error fetching schedules:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch schedules';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Create a school-specific notification schedule
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user
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

    if (!userData) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!userData.school_id) {
      return NextResponse.json({ error: 'No school assigned' }, { status: 400 });
    }

    const body = await request.json();
    const { days_before_expiry, notification_type, is_active, cc_emails } = body;

    if (!days_before_expiry || !notification_type) {
      return NextResponse.json({ error: 'Days and notification type are required' }, { status: 400 });
    }

    const { data, error } = await client
      .from('certification_notification_schedules')
      .insert({
        school_id: userData.school_id,
        days_before_expiry,
        notification_type,
        is_active: is_active ?? true,
        cc_emails: cc_emails && cc_emails.length > 0 ? cc_emails : null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A schedule for this number of days already exists' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, schedule: data });
  } catch (error: unknown) {
    console.error('Error creating schedule:', error);
    const message = error instanceof Error ? error.message : 'Failed to create schedule';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
