import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const effectiveUserId = await getEffectiveUserId();

    if (!effectiveUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is an assistant coach
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', effectiveUserId)
      .single();

    if (userData?.role !== 'assistant_coach') {
      return NextResponse.json({ error: 'Forbidden: Only assistant coaches can access this endpoint' }, { status: 403 });
    }

    // Fetch assigned coaches
    const { data: coachAssignments } = await supabase
      .from('coach_assistants')
      .select('coach_id')
      .eq('assistant_id', effectiveUserId);

    const coachIds = coachAssignments?.map(ca => ca.coach_id) || [];

    if (coachIds.length === 0) {
      return NextResponse.json({ programs: [] });
    }

    // Fetch programs from all assigned coaches
    const { data: programsData } = await supabase
      .from('program_coaches')
      .select(`
        program_id,
        coach_id,
        coach:coach_id (first_name, last_name),
        summer_programs (
          id,
          name,
          description,
          start_date,
          end_date,
          registration_deadline,
          cost,
          header_image_url
        )
      `)
      .in('coach_id', coachIds);

    const programs = programsData?.map(pc => ({
      ...pc.summer_programs,
      coach_id: pc.coach_id,
      coach_name: pc.coach ? `${(pc.coach as any).first_name} ${(pc.coach as any).last_name}` : 'Unknown'
    })).filter(Boolean) || [];

    return NextResponse.json({ programs });
  } catch (error: any) {
    console.error('Error fetching assistant programs:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch programs'
    }, { status: 500 });
  }
}
