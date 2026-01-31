import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';

// GET - List certification types available to the coach (global + school-specific)
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId();
    if (!effectiveUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!userData || userData.role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get global certification types (school_id is null) and school-specific types
    let query = supabase
      .from('certification_types')
      .select('*')
      .order('name');

    if (userData.school_id) {
      query = query.or(`school_id.is.null,school_id.eq.${userData.school_id}`);
    } else {
      // If coach has no school, only show global types
      query = query.is('school_id', null);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ certificationTypes: data });
  } catch (error: unknown) {
    console.error('Error fetching certification types:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch certification types';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
