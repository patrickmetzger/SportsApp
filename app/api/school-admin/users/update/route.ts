import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectiveUserId } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId();

    // Use adminClient to handle impersonation
    const { data: currentUserData } = await adminClient
      .from('users')
      .select('role, school_id')
      .eq('id', effectiveUserId)
      .single();

    const isAdmin = currentUserData?.role === 'admin';
    const isSchoolAdmin = currentUserData?.role === 'school_admin';

    if (!currentUserData || (!isAdmin && !isSchoolAdmin) || (!isAdmin && !currentUserData.school_id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // At this point, currentUserData is guaranteed to be non-null
    const userData = currentUserData;

    const body = await request.json();
    const { id, email, first_name, last_name, phone, role, school_id, approval_status } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate role
    if (role && !['coach', 'assistant_coach', 'parent', 'school_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Validate approval_status
    if (approval_status && !['pending', 'approved', 'rejected'].includes(approval_status)) {
      return NextResponse.json({ error: 'Invalid approval status' }, { status: 400 });
    }

    // Validate school_id matches current user's school (for school admins)
    if (!isAdmin && school_id && school_id !== userData.school_id) {
      return NextResponse.json({ error: 'Can only update users at your school' }, { status: 403 });
    }

    // Verify the user being edited belongs to this school (for school admins)
    const { data: userToEdit } = await adminClient
      .from('users')
      .select('school_id, role')
      .eq('id', id)
      .single();

    if (!userToEdit) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // School admins can only edit users from their school
    if (!isAdmin && userToEdit.school_id !== userData.school_id) {
      return NextResponse.json({ error: 'User not at your school' }, { status: 403 });
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

    // Handle approval_status for assistant coaches
    if (approval_status !== undefined && (role === 'assistant_coach' || userToEdit.role === 'assistant_coach')) {
      updateData.approval_status = approval_status;
      if (approval_status === 'approved') {
        updateData.approved_by = effectiveUserId;
        updateData.approved_at = new Date().toISOString();
        updateData.rejected_reason = null;
      } else if (approval_status === 'rejected') {
        // Keep approved_by/approved_at if previously approved
      } else if (approval_status === 'pending') {
        updateData.approved_by = null;
        updateData.approved_at = null;
        updateData.rejected_reason = null;
      }
    }

    // Use adminClient for the update to handle impersonation and approval_status
    const { error: updateError } = await adminClient
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
