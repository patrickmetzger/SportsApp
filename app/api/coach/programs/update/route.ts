import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectiveUserId, getUserRole } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const effectiveUserId = await getEffectiveUserId();
    if (!effectiveUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await getUserRole();
    if (role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden: Only coaches can update programs' }, { status: 403 });
    }

    const supabase = await createClient();

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
      program_image_url,
      min_grade,
      max_grade,
      min_age,
      max_age,
      gender_restriction,
      eligibility_notes
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Program ID is required' }, { status: 400 });
    }

    // Verify the program exists and coach has access (either submitted it or is assigned)
    const adminClient = createAdminClient();
    const { data: program } = await adminClient
      .from('summer_programs')
      .select('id, submitted_by')
      .eq('id', id)
      .single();

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    const isCreator = program.submitted_by === effectiveUserId;

    const { data: assignment } = await adminClient
      .from('program_coaches')
      .select('id')
      .eq('program_id', id)
      .eq('coach_id', effectiveUserId)
      .maybeSingle();

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
        min_grade: min_grade || null,
        max_grade: max_grade || null,
        min_age: min_age || null,
        max_age: max_age || null,
        gender_restriction: gender_restriction || 'any',
        eligibility_notes: eligibility_notes || null,
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
