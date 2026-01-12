import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: currentUserData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (!['admin', 'school_admin'].includes(currentUserData?.role || '')) {
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
      .eq('role', 'coach')
      .eq('archived', false);

    // School admins only see coaches at their school
    if (currentUserData.role === 'school_admin' && currentUserData.school_id) {
      query = query.eq('school_id', currentUserData.school_id);
    }

    const { data: coaches, error } = await query.order('last_name');

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ coaches: coaches || [] });
  } catch (error: any) {
    console.error('Error fetching coaches:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch coaches' },
      { status: 500 }
    );
  }
}
