import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the effective user ID (handles impersonation)
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
      return NextResponse.json({ error: 'Forbidden: Only coaches can update programs' }, { status: 403 });
    }

    // Get program data from request
    const body = await request.json();
    const {
      id,
      name,
      description,
      start_date,
      end_date,
      registration_deadline,
      cost,
      header_image_url,
      program_image_url
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Program ID is required' }, { status: 400 });
    }

    // Verify the program exists and coach has access (either created it or is assigned)
    const { data: program } = await supabase
      .from('summer_programs')
      .select('id, created_by')
      .eq('id', id)
      .single();

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Check if coach created it or is assigned to it
    const isCreator = program.created_by === effectiveUserId;

    const { data: assignment } = await supabase
      .from('program_coaches')
      .select('id')
      .eq('program_id', id)
      .eq('coach_id', effectiveUserId)
      .single();

    const isAssigned = !!assignment;

    if (!isCreator && !isAssigned) {
      return NextResponse.json({
        error: 'Forbidden: You do not have permission to edit this program'
      }, { status: 403 });
    }

    // Update the program
    const { error: updateError } = await supabase
      .from('summer_programs')
      .update({
        name,
        description,
        start_date,
        end_date,
        registration_deadline,
        cost,
        header_image_url: header_image_url || null,
        program_image_url: program_image_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating program:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Program updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating program:', error);
    return NextResponse.json({
      error: error.message || 'Failed to update program'
    }, { status: 500 });
  }
}
