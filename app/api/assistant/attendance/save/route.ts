import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Forbidden: Only assistant coaches can save attendance via this endpoint' }, { status: 403 });
    }

    // Get attendance records from request
    const body = await request.json();
    const { records } = body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'No attendance records provided' }, { status: 400 });
    }

    // Fetch assigned coaches
    const { data: coachAssignments } = await supabase
      .from('coach_assistants')
      .select('coach_id')
      .eq('assistant_id', effectiveUserId);

    const coachIds = coachAssignments?.map(ca => ca.coach_id) || [];

    if (coachIds.length === 0) {
      return NextResponse.json({ error: 'Forbidden: You are not assigned to any coaches' }, { status: 403 });
    }

    // Verify the assistant's assigned coach is assigned to the program
    const programId = records[0].program_id;
    const { data: programCoach } = await supabase
      .from('program_coaches')
      .select('id')
      .eq('program_id', programId)
      .in('coach_id', coachIds)
      .limit(1)
      .single();

    if (!programCoach) {
      return NextResponse.json({ error: 'Forbidden: Your assigned coaches are not assigned to this program' }, { status: 403 });
    }

    // Ensure all records have the correct recorded_by (the assistant coach)
    const sanitizedRecords = records.map(record => ({
      ...record,
      recorded_by: effectiveUserId
    }));

    // Use upsert to insert or update attendance records
    const { error: upsertError } = await supabase
      .from('program_attendance')
      .upsert(sanitizedRecords, {
        onConflict: 'program_id,student_name,attendance_date'
      });

    if (upsertError) {
      console.error('Error saving attendance:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance saved successfully',
      count: records.length
    });
  } catch (error: any) {
    console.error('Error saving attendance:', error);
    return NextResponse.json({
      error: error.message || 'Failed to save attendance'
    }, { status: 500 });
  }
}
