import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: currentUserData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (!currentUserData || !['admin', 'school_admin'].includes(currentUserData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build query
    let query = supabase
      .from('users')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        school:school_id (
          id,
          name,
          city,
          state
        )
      `)
      .eq('role', 'parent')
      .eq('archived', false);

    // School admins only see parents at their school
    if (currentUserData.role === 'school_admin' && currentUserData.school_id) {
      query = query.eq('school_id', currentUserData.school_id);
    }

    const { data: parents, error } = await query.order('last_name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ parents });
  } catch (error: any) {
    console.error('Error fetching parents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
