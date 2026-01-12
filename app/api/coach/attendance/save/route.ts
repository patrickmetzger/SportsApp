import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Forbidden: Only coaches can save attendance' }, { status: 403 });
    }

    // Get attendance records from request
    const body = await request.json();
    const { records } = body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'No attendance records provided' }, { status: 400 });
    }

    // Verify the coach is assigned to the program
    const programId = records[0].program_id;
    const { data: coachAssignment } = await supabase
      .from('program_coaches')
      .select('id')
      .eq('coach_id', effectiveUserId)
      .eq('program_id', programId)
      .single();

    if (!coachAssignment) {
      return NextResponse.json({ error: 'Forbidden: You are not assigned to this program' }, { status: 403 });
    }

    // Use upsert to insert or update attendance records
    // The unique constraint on (program_id, student_name, attendance_date) handles duplicates
    const { error: upsertError } = await supabase
      .from('program_attendance')
      .upsert(records, {
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
