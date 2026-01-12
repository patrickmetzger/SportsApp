import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: schoolId } = await params;

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: currentUserData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (currentUserData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { coach_ids } = body;

    if (!Array.isArray(coach_ids)) {
      return NextResponse.json(
        { error: 'coach_ids must be an array' },
        { status: 400 }
      );
    }

    // First, unassign all coaches currently assigned to this school
    // that are not in the new selection
    await supabase
      .from('users')
      .update({ school_id: null })
      .eq('school_id', schoolId)
      .eq('role', 'coach')
      .not('id', 'in', `(${coach_ids.length > 0 ? coach_ids.join(',') : 'NULL'})`);

    // Then, assign all selected coaches to this school
    if (coach_ids.length > 0) {
      await supabase
        .from('users')
        .update({ school_id: schoolId })
        .eq('role', 'coach')
        .in('id', coach_ids);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${coach_ids.length} coach${coach_ids.length !== 1 ? 'es' : ''} to school`,
    });
  } catch (error: any) {
    console.error('Bulk assign coaches error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assign coaches' },
      { status: 500 }
    );
  }
}
