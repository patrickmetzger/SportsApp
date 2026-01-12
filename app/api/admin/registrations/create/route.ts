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
      .select('role')
      .eq('id', user.id)
      .single();

    if (currentUserData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      program_id,
      student_id,
      student_name,
      parent_name,
      parent_email,
      parent_phone,
      status,
      payment_status,
      amount_due,
      amount_paid,
      payment_due_date,
      notes,
    } = body;

    // Validate required fields
    if (!program_id || !student_id || !student_name || !parent_name || !parent_email || !parent_phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if student is already registered
    const { data: existingRegistration } = await supabase
      .from('program_registrations')
      .select('*')
      .eq('program_id', program_id)
      .eq('student_id', student_id)
      .single();

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'This student is already registered for this program' },
        { status: 400 }
      );
    }

    // Check if parent user exists
    const { data: parentUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', parent_email)
      .eq('role', 'parent')
      .single();

    // Create registration
    const { data: registration, error: regError } = await supabase
      .from('program_registrations')
      .insert({
        program_id,
        student_id,
        student_name,
        parent_name,
        parent_email,
        parent_phone,
        parent_user_id: parentUser?.id || null,
        status: status || 'approved',
        payment_status: payment_status || 'pending',
        amount_due: amount_due || 0,
        amount_paid: amount_paid || 0,
        payment_due_date: payment_due_date || null,
        notes: notes || null,
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
    });
  } catch (error: any) {
    console.error('Create manual registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create registration' },
      { status: 500 }
    );
  }
}
