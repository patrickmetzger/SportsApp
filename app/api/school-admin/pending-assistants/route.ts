import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';

// GET - List pending assistant coaches for the school
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId();

    // Verify user is a school admin and get their school
    const { data: adminData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!adminData || adminData.role !== 'school_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!adminData.school_id) {
      return NextResponse.json({ error: 'No school assigned' }, { status: 400 });
    }

    // Get pending assistant coaches for this school
    const { data: pendingAssistants, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        approval_status,
        created_at,
        school:school_id(name)
      `)
      .eq('school_id', adminData.school_id)
      .eq('role', 'assistant_coach')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

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
