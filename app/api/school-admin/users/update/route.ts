import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: currentUserData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (!currentUserData || currentUserData.role !== 'school_admin' || !currentUserData.school_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // At this point, currentUserData is guaranteed to be non-null
    const userData = currentUserData;

    const body = await request.json();
    const { id, email, first_name, last_name, phone, role, school_id } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate role
    if (role && !['coach', 'assistant_coach', 'parent', 'school_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Validate school_id matches current user's school
    if (school_id && school_id !== userData.school_id) {
      return NextResponse.json({ error: 'Can only update users at your school' }, { status: 403 });
    }

    // Verify the user being edited belongs to this school
    const { data: userToEdit } = await supabase
      .from('users')
      .select('school_id, role')
      .eq('id', id)
      .single();

    if (!userToEdit || userToEdit.school_id !== userData.school_id) {
      return NextResponse.json({ error: 'User not found or not at your school' }, { status: 404 });
    }

    // Prevent editing users of unauthorized roles
    if (!['coach', 'assistant_coach', 'parent', 'school_admin'].includes(userToEdit.role)) {
      return NextResponse.json({ error: 'Cannot edit this user' }, { status: 403 });
    }

    // Update user record
    const updateData: any = {};
    if (email) updateData.email = email;
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (phone !== undefined) updateData.phone = phone;
    if (role) updateData.role = role;
    if (school_id) updateData.school_id = school_id;

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({
      error: error.message || 'Failed to update user'
    }, { status: 500 });
  }
}
