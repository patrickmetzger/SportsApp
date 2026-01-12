import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';

// PUT - Update a child
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    // Update child record (RLS will ensure parent owns this child)
    const { data: child, error } = await supabase
      .from('parent_children')
      .update({
        first_name,
        last_name,
        student_id: student_id || null,
        date_of_birth: date_of_birth || null,
        grade: grade || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('parent_user_id', effectiveUserId) // Ensure parent owns this child
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!child) {
      return NextResponse.json(
        { error: 'Child not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, child });
  } catch (error: any) {
    console.error('Error updating child:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update child' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a child
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    // Delete child record (RLS will ensure parent owns this child)
    const { error } = await supabase
      .from('parent_children')
      .delete()
      .eq('id', id)
      .eq('parent_user_id', effectiveUserId); // Ensure parent owns this child

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting child:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete child' },
      { status: 500 }
    );
  }
}
