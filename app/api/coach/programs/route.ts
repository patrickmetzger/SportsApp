import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectiveUserId, getUserRole } from '@/lib/auth';

// GET - Return all programs the coach submitted or is assigned to
export async function GET() {
  try {
    const effectiveUserId = await getEffectiveUserId();
    if (!effectiveUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = await getUserRole();
    if (role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const adminClient = createAdminClient();

    const [{ data: assignedData }, { data: submittedData }] = await Promise.all([
      adminClient
        .from('program_coaches')
        .select('summer_programs(id, name, status, rejection_reason, start_date, end_date, submitted_by)')
        .eq('coach_id', effectiveUserId),
      adminClient
        .from('summer_programs')
        .select('id, name, status, rejection_reason, start_date, end_date, submitted_by')
        .eq('submitted_by', effectiveUserId),
    ]);

    const assignedPrograms = (assignedData?.map((pc: any) => pc.summer_programs).filter(Boolean) || []) as any[];
    const submittedPrograms = submittedData || [];
    const submittedIds = new Set(submittedPrograms.map((p: any) => p.id));
    const programs = [
      ...submittedPrograms,
      ...assignedPrograms.filter((p: any) => !submittedIds.has(p.id)),
    ];

    return NextResponse.json({ programs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch programs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
