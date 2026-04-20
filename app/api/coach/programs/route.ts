import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const effectiveUserId = await getEffectiveUserId();

    const { data: coachData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!coachData || coachData.role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!coachData.school_id) {
      return NextResponse.json({ error: 'No school assigned to your account' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      description,
      start_date,
      end_date,
      registration_deadline,
      cost,
      header_image_url,
      program_image_url,
    } = body;

    if (!name || !description || !start_date || !end_date || !registration_deadline || cost === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: program, error: programError } = await supabase
      .from('summer_programs')
      .insert({
        name,
        description,
        start_date,
        end_date,
        registration_deadline,
        cost: parseFloat(cost),
        header_image_url: header_image_url || null,
        program_image_url: program_image_url || null,
        school_id: coachData.school_id,
        status: 'pending',
        submitted_by: effectiveUserId,
        requirements: [],
      })
      .select()
      .single();

    if (programError) {
      console.error('Error creating program:', programError);
      return NextResponse.json({ error: programError.message }, { status: 400 });
    }

    // Add coach as primary coach in program_coaches
    await supabase.from('program_coaches').insert({
      program_id: program.id,
      coach_id: effectiveUserId,
      role: 'head',
    });

    return NextResponse.json({ program }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create program';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
