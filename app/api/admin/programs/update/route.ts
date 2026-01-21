import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest) {
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

    // Allow both admin and school_admin
    if (!currentUserData || !['admin', 'school_admin'].includes(currentUserData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, coach_ids, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Program ID is required' },
        { status: 400 }
      );
    }

    // For school_admins, verify the program belongs to their school
    if (currentUserData.role === 'school_admin') {
      const { data: programToEdit } = await supabase
        .from('summer_programs')
        .select('school_id')
        .eq('id', id)
        .single();

      if (!programToEdit || programToEdit.school_id !== currentUserData.school_id) {
        return NextResponse.json(
          { error: 'Program not found or not at your school' },
          { status: 404 }
        );
      }
    }

    // Update program
    const { error: updateError } = await supabase
      .from('summer_programs')
      .update({
        name: updateData.name,
        description: updateData.description,
        start_date: updateData.start_date,
        end_date: updateData.end_date,
        registration_deadline: updateData.registration_deadline,
        cost: updateData.cost,
        requirements: updateData.requirements,
        header_image_url: updateData.header_image_url,
        program_image_url: updateData.program_image_url,
        min_grade: updateData.min_grade,
        max_grade: updateData.max_grade,
        min_age: updateData.min_age,
        max_age: updateData.max_age,
        gender_restriction: updateData.gender_restriction,
        eligibility_notes: updateData.eligibility_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    // Update coach associations
    // First, delete existing associations
    await supabase
      .from('program_coaches')
      .delete()
      .eq('program_id', id);

    // Then insert new associations
    if (coach_ids && coach_ids.length > 0) {
      const coachAssociations = coach_ids.map((coachId: string) => ({
        program_id: id,
        coach_id: coachId,
        role: 'coach',
      }));

      const { error: coachError } = await supabase
        .from('program_coaches')
        .insert(coachAssociations);

      if (coachError) {
        console.error('Error associating coaches:', coachError);
        // Don't fail the whole operation, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Program updated successfully',
    });
  } catch (error: any) {
    console.error('Update program error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update program' },
      { status: 500 }
    );
  }
}
