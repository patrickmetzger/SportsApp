import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { registrationSchema } from '@/lib/validation/programSchema';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { programId, studentName, studentId, parentName, parentEmail, parentPhone } = body;

    // Validate input
    const validation = registrationSchema.safeParse({
      studentName,
      studentId,
      parentName,
      parentEmail,
      parentPhone,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    if (!programId) {
      return NextResponse.json(
        { error: 'Program ID is required' },
        { status: 400 }
      );
    }

    // Verify student exists
    const { data: student, error: studentError } = await supabase
      .from('mock_students')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Invalid student ID' },
        { status: 400 }
      );
    }

    // Check if program exists and is still open
    const { data: program, error: programError } = await supabase
      .from('summer_programs')
      .select('*')
      .eq('id', programId)
      .single();

    if (programError || !program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    if (new Date(program.registration_deadline) < new Date()) {
      return NextResponse.json(
        { error: 'Registration deadline has passed' },
        { status: 400 }
      );
    }

    // Check eligibility criteria
    const eligibilityErrors: string[] = [];

    // Grade eligibility
    if (student.grade !== null && student.grade !== undefined) {
      if (program.min_grade && student.grade < program.min_grade) {
        eligibilityErrors.push(
          `Student must be in grade ${program.min_grade} or higher (currently in grade ${student.grade})`
        );
      }
      if (program.max_grade && student.grade > program.max_grade) {
        eligibilityErrors.push(
          `Student must be in grade ${program.max_grade} or lower (currently in grade ${student.grade})`
        );
      }
    }

    // Age eligibility
    if (student.date_of_birth) {
      const today = new Date();
      const birthDate = new Date(student.date_of_birth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (program.min_age && age < program.min_age) {
        eligibilityErrors.push(
          `Student must be at least ${program.min_age} years old (currently ${age} years old)`
        );
      }
      if (program.max_age && age > program.max_age) {
        eligibilityErrors.push(
          `Student must be ${program.max_age} years old or younger (currently ${age} years old)`
        );
      }
    }

    // Gender eligibility
    if (program.gender_restriction && program.gender_restriction !== 'any') {
      if (student.gender && student.gender !== program.gender_restriction) {
        eligibilityErrors.push(
          `This program is only open to ${program.gender_restriction} students`
        );
      }
    }

    if (eligibilityErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Student does not meet eligibility requirements',
          details: eligibilityErrors,
        },
        { status: 400 }
      );
    }

    // Check for duplicate registration
    const { data: existingRegistration } = await supabase
      .from('program_registrations')
      .select('*')
      .eq('program_id', programId)
      .eq('student_id', studentId)
      .single();

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'This student is already registered for this program' },
        { status: 400 }
      );
    }

    // Check if parent user already exists
    const { data: existingParent } = await supabase
      .from('users')
      .select('id')
      .eq('email', parentEmail)
      .eq('role', 'parent')
      .single();

    let parentUserId = existingParent?.id;

    // If parent doesn't exist, create account and send invite email
    if (!parentUserId) {
      const { data: inviteData, error: inviteError } = await supabase.auth.signUp({
        email: parentEmail,
        password: Math.random().toString(36).slice(-12), // Temporary password
        options: {
          data: {
            role: 'parent',
            invited: true,
            first_name: parentName.split(' ')[0] || '',
            last_name: parentName.split(' ').slice(1).join(' ') || '',
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/setup`,
        },
      });

      if (inviteError) {
        console.error('Error creating parent account:', inviteError);
        // Don't fail registration if invite fails, just log it
      }

      // Create user record
      if (inviteData.user) {
        const { data: newParent } = await supabase.from('users').insert({
          id: inviteData.user.id,
          email: parentEmail,
          role: 'parent',
          first_name: parentName.split(' ')[0] || '',
          last_name: parentName.split(' ').slice(1).join(' ') || '',
        }).select().single();

        parentUserId = newParent?.id;
      }
    }

    // Create registration with payment information
    const { data: registration, error: regError } = await supabase
      .from('program_registrations')
      .insert({
        program_id: programId,
        student_name: studentName,
        student_id: studentId,
        parent_name: parentName,
        parent_email: parentEmail,
        parent_phone: parentPhone,
        parent_user_id: parentUserId,
        status: 'pending',
        payment_status: 'pending',
        amount_due: program.cost || 0,
        amount_paid: 0,
        payment_due_date: program.start_date, // Payment due by program start date
      })
      .select()
      .single();

    if (regError) {
      return NextResponse.json(
        { error: regError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      registration,
      parentAccountCreated: !existingParent,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
