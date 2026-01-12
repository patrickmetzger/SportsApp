import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Check if student exists in mock data
    const { data: student, error } = await supabase
      .from('mock_students')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error || !student) {
      return NextResponse.json(
        { error: 'Student ID not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      student: {
        firstName: student.first_name,
        lastName: student.last_name,
        grade: student.grade,
      },
    });
  } catch (error: any) {
    console.error('Student validation error:', error);
    return NextResponse.json(
      { error: error.message || 'Validation failed' },
      { status: 500 }
    );
  }
}
