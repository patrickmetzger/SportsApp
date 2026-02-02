import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';

// GET - Fetch all assistant coach assignments (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const effectiveUserId = await getEffectiveUserId();

    if (!effectiveUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is an admin or school_admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!userData?.role || !['admin', 'school_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Build query for assignments
    let assignmentsQuery = supabase
      .from('coach_assistants')
      .select(`
        id,
        created_at,
        coach:coach_id (
          id,
          email,
          first_name,
          last_name,
          school_id
        ),
        assistant:assistant_id (
          id,
          email,
          first_name,
          last_name,
          school_id
        )
      `)
      .order('created_at', { ascending: false });

    const { data: assignments, error } = await assignmentsQuery;

    if (error) {
      console.error('Error fetching assignments:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Filter by school for school_admin
    let filteredAssignments = assignments || [];
    if (userData.role === 'school_admin' && userData.school_id) {
      filteredAssignments = filteredAssignments.filter(a =>
        (a.coach as any)?.school_id === userData.school_id
      );
    }

    // Fetch all assistant coaches
    let assistantsQuery = supabase
      .from('users')
      .select('id, email, first_name, last_name, school_id')
      .eq('role', 'assistant_coach');

    if (userData.role === 'school_admin' && userData.school_id) {
      assistantsQuery = assistantsQuery.eq('school_id', userData.school_id);
    }

    const { data: assistantCoaches } = await assistantsQuery;

    // Fetch all coaches
    let coachesQuery = supabase
      .from('users')
      .select('id, email, first_name, last_name, school_id')
      .eq('role', 'coach');

    if (userData.role === 'school_admin' && userData.school_id) {
      coachesQuery = coachesQuery.eq('school_id', userData.school_id);
    }

    const { data: coaches } = await coachesQuery;

    return NextResponse.json({
      assignments: filteredAssignments.map(a => ({
        id: a.id,
        createdAt: a.created_at,
        coach: a.coach,
        assistant: a.assistant
      })),
      assistantCoaches: assistantCoaches || [],
      coaches: coaches || []
    });
  } catch (error: any) {
    console.error('Error fetching assistant coach data:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch data'
    }, { status: 500 });
  }
}

// POST - Create an assistant coach assignment (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const effectiveUserId = await getEffectiveUserId();

    if (!effectiveUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is an admin or school_admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!userData?.role || !['admin', 'school_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { coachId, assistantId } = body;

    if (!coachId || !assistantId) {
      return NextResponse.json({ error: 'Both coach ID and assistant ID are required' }, { status: 400 });
    }

    // Verify both users exist and have correct roles
    const { data: coachData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', coachId)
      .single();

    const { data: assistantData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', assistantId)
      .single();

    if (coachData?.role !== 'coach') {
      return NextResponse.json({ error: 'Target coach is not a coach' }, { status: 400 });
    }

    if (assistantData?.role !== 'assistant_coach') {
      return NextResponse.json({ error: 'Target assistant is not an assistant coach' }, { status: 400 });
    }

    // School admin can only assign within their school
    if (userData.role === 'school_admin' && userData.school_id) {
      if (coachData.school_id !== userData.school_id) {
        return NextResponse.json({ error: 'Coach is not in your school' }, { status: 403 });
      }
    }

    // Create the assignment
    const { data: assignment, error } = await supabase
      .from('coach_assistants')
      .insert({
        coach_id: coachId,
        assistant_id: assistantId,
        created_by: effectiveUserId
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This assignment already exists' }, { status: 400 });
      }
      console.error('Error creating assignment:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      assignment
    });
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    return NextResponse.json({
      error: error.message || 'Failed to create assignment'
    }, { status: 500 });
  }
}

// DELETE - Remove an assistant coach assignment (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const effectiveUserId = await getEffectiveUserId();

    if (!effectiveUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is an admin or school_admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!userData?.role || !['admin', 'school_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    // For school admins, verify the assignment is within their school
    if (userData.role === 'school_admin' && userData.school_id) {
      const { data: assignment } = await supabase
        .from('coach_assistants')
        .select(`
          id,
          coach:coach_id (school_id)
        `)
        .eq('id', assignmentId)
        .single();

      if (!assignment || (assignment.coach as any)?.school_id !== userData.school_id) {
        return NextResponse.json({ error: 'Assignment not found or not authorized' }, { status: 404 });
      }
    }

    // Delete the assignment
    const { error } = await supabase
      .from('coach_assistants')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      console.error('Error deleting assignment:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Assignment removed successfully'
    });
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json({
      error: error.message || 'Failed to delete assignment'
    }, { status: 500 });
  }
}
