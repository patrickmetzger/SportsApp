import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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
    if (!['admin', 'school_admin'].includes(currentUserData?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      start_date,
      end_date,
      registration_deadline,
      cost,
      requirements,
      header_image_url,
      program_image_url,
      coach_ids,
      min_grade,
      max_grade,
      min_age,
      max_age,
      gender_restriction,
      eligibility_notes,
      school_id,
    } = body;

    // School admins must provide their school_id
    if (currentUserData.role === 'school_admin') {
      if (!school_id || school_id !== currentUserData.school_id) {
        return NextResponse.json(
          { error: 'Can only create programs for your school' },
          { status: 403 }
        );
      }
    }

    // Validate required fields
    if (!name || !description || !start_date || !end_date || !registration_deadline) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // School_id is required
    if (!school_id) {
      return NextResponse.json({ error: 'School is required' }, { status: 400 });
    }

    // Create program with school_id
    const { data: program, error: programError } = await supabase
      .from('summer_programs')
      .insert({
        name,
        description,
        start_date,
        end_date,
        registration_deadline,
        cost: cost || 0,
        requirements: requirements || [],
        header_image_url,
        program_image_url,
        min_grade,
        max_grade,
        min_age,
        max_age,
        gender_restriction,
        eligibility_notes,
        school_id, // CRITICAL: Include school_id
      })
      .select()
      .single();

    if (programError) {
      return NextResponse.json(
        { error: programError.message },
        { status: 400 }
      );
    }

    // Associate coaches with the program
    if (coach_ids && coach_ids.length > 0) {
      const coachAssociations = coach_ids.map((coachId: string) => ({
        program_id: program.id,
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
      program,
    });
  } catch (error: any) {
    console.error('Create program error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create program' },
      { status: 500 }
    );
  }
}
