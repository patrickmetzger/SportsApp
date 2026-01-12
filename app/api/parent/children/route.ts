import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';

// GET - List all children for authenticated parent
export async function GET() {
  try {
    const supabase = await createClient();

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = await getEffectiveUserId();

    if (!effectiveUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is a parent
    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .eq('id', effectiveUserId)
      .single();

    if (userRecord?.role !== 'parent') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Fetch children
    const { data: children, error } = await supabase
      .from('parent_children')
      .select('*')
      .eq('parent_user_id', effectiveUserId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ children });
  } catch (error: any) {
    console.error('Error fetching children:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch children' },
      { status: 500 }
    );
  }
}

// POST - Add a new child
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = await getEffectiveUserId();

    if (!effectiveUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is a parent
    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .eq('id', effectiveUserId)
      .single();

    if (userRecord?.role !== 'parent') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { first_name, last_name, student_id, date_of_birth, grade, notes } = body;

    // Validate required fields
    if (!first_name || !last_name) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Create child record
    const { data: child, error } = await supabase
      .from('parent_children')
      .insert({
        parent_user_id: effectiveUserId,
        first_name,
        last_name,
        student_id: student_id || null,
        date_of_birth: date_of_birth || null,
        grade: grade || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, child });
  } catch (error: any) {
    console.error('Error adding child:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add child' },
      { status: 500 }
    );
  }
}
