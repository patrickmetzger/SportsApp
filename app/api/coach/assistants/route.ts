import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';

// GET - Fetch assistants assigned to the current coach
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const effectiveUserId = await getEffectiveUserId();

    if (!effectiveUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is a coach
    const { data: userData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', effectiveUserId)
      .single();

    if (userData?.role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden: Only coaches can access this endpoint' }, { status: 403 });
    }

    // Fetch assigned assistants
    const { data: assignments, error } = await supabase
      .from('coach_assistants')
      .select(`
        id,
        created_at,
        assistant:assistant_id (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('coach_id', effectiveUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assistants:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Fetch available assistant coaches from the same school that aren't already assigned
    const assignedIds = assignments?.map(a => (a.assistant as any)?.id).filter(Boolean) || [];

    let availableQuery = supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('role', 'assistant_coach');

    if (userData.school_id) {
      availableQuery = availableQuery.eq('school_id', userData.school_id);
    }

    if (assignedIds.length > 0) {
      availableQuery = availableQuery.not('id', 'in', `(${assignedIds.join(',')})`);
    }

    const { data: availableAssistants } = await availableQuery;

    return NextResponse.json({
      assistants: assignments?.map(a => ({
        assignmentId: a.id,
        createdAt: a.created_at,
        ...a.assistant
      })) || [],
      available: availableAssistants || []
    });
  } catch (error: any) {
    console.error('Error fetching assistants:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch assistants'
    }, { status: 500 });
  }
}

// POST - Assign an assistant to the current coach
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const effectiveUserId = await getEffectiveUserId();

    if (!effectiveUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is a coach
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', effectiveUserId)
      .single();

    if (userData?.role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden: Only coaches can assign assistants' }, { status: 403 });
    }

    const body = await request.json();
    const { assistantId } = body;

    if (!assistantId) {
      return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 });
    }

    // Verify the target user is an assistant coach
    const { data: assistantData } = await supabase
      .from('users')
      .select('role')
      .eq('id', assistantId)
      .single();

    if (assistantData?.role !== 'assistant_coach') {
      return NextResponse.json({ error: 'User is not an assistant coach' }, { status: 400 });
    }

    // Create the assignment
    const { data: assignment, error } = await supabase
      .from('coach_assistants')
      .insert({
        coach_id: effectiveUserId,
        assistant_id: assistantId,
        created_by: effectiveUserId
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'This assistant is already assigned to you' }, { status: 400 });
      }
      console.error('Error assigning assistant:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      assignment
    });
  } catch (error: any) {
    console.error('Error assigning assistant:', error);
    return NextResponse.json({
      error: error.message || 'Failed to assign assistant'
    }, { status: 500 });
  }
}

// DELETE - Remove an assistant assignment
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const effectiveUserId = await getEffectiveUserId();

    if (!effectiveUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is a coach
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', effectiveUserId)
      .single();

    if (userData?.role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden: Only coaches can remove assistants' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    // Verify the assignment belongs to this coach
    const { data: assignment } = await supabase
      .from('coach_assistants')
      .select('id')
      .eq('id', assignmentId)
      .eq('coach_id', effectiveUserId)
      .single();

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found or not authorized' }, { status: 404 });
    }

    // Delete the assignment
    const { error } = await supabase
      .from('coach_assistants')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      console.error('Error removing assistant:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Assistant removed successfully'
    });
  } catch (error: any) {
    console.error('Error removing assistant:', error);
    return NextResponse.json({
      error: error.message || 'Failed to remove assistant'
    }, { status: 500 });
  }
}
