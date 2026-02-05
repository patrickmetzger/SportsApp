import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';

// GET - List pending assistant coaches for the school (or all schools for admins)
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId();

    // Verify user is an admin or school admin
    const { data: adminData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', effectiveUserId)
      .single();

    const isAdmin = adminData?.role === 'admin';
    const isSchoolAdmin = adminData?.role === 'school_admin';

    if (!adminData || (!isAdmin && !isSchoolAdmin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // School admins need a school assigned
    if (isSchoolAdmin && !adminData.school_id) {
      return NextResponse.json({ error: 'No school assigned' }, { status: 400 });
    }

    // Build query - admins see all, school admins see only their school
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        approval_status,
        created_at,
        school:school_id(id, name)
      `)
      .eq('role', 'assistant_coach')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

    // Filter by school for school admins
    if (isSchoolAdmin) {
      query = query.eq('school_id', adminData.school_id);
    }

    const { data: pendingAssistants, error } = await query;

    if (error) {
      console.error('Error fetching pending assistants:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Get certification counts for each assistant
    const assistantsWithCounts = await Promise.all(
      (pendingAssistants || []).map(async (assistant) => {
        const { count } = await supabase
          .from('coach_certifications')
          .select('*', { count: 'exact', head: true })
          .eq('coach_id', assistant.id);

        // Get inviting coach info
        const { data: coachAssignment } = await supabase
          .from('coach_assistants')
          .select(`
            coach:coach_id(
              id,
              first_name,
              last_name,
              email
            )
          `)
          .eq('assistant_id', assistant.id)
          .single();

        return {
          ...assistant,
          certification_count: count || 0,
          invited_by_coach: coachAssignment?.coach || null,
        };
      })
    );

    return NextResponse.json({ pendingAssistants: assistantsWithCounts });
  } catch (error: unknown) {
    console.error('Error fetching pending assistants:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch pending assistants';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
