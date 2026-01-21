import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify the current user is an admin
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: currentUserData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (!currentUserData || !['admin', 'school_admin'].includes(currentUserData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // At this point, currentUserData is guaranteed to be non-null
    const userData = currentUserData;

    const body = await request.json();
    const { userId, archived } = body;

    if (!userId || typeof archived !== 'boolean') {
      return NextResponse.json({ error: 'User ID and archived status are required' }, { status: 400 });
    }

    // Prevent archiving yourself
    if (userId === user.id) {
      return NextResponse.json({ error: 'You cannot archive yourself' }, { status: 400 });
    }

    // For school admins, verify the user belongs to their school
    if (userData.role === 'school_admin') {
      const { data: userToArchive } = await supabase
        .from('users')
        .select('school_id, role')
        .eq('id', userId)
        .single();

      if (!userToArchive) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // School admins can only archive users at their school
      if (userToArchive.school_id !== userData.school_id) {
        return NextResponse.json({ error: 'Can only archive users at your school' }, { status: 403 });
      }

      // School admins can only archive coaches, parents, and other school_admins
      if (!['coach', 'parent', 'school_admin'].includes(userToArchive.role)) {
        return NextResponse.json({ error: 'Cannot archive this user type' }, { status: 403 });
      }
    }

    // Update the user's archived status
    const { error: updateError } = await supabase
      .from('users')
      .update({ archived })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${archived ? 'archived' : 'unarchived'} successfully`,
    });
  } catch (error: any) {
    console.error('Error toggling archive status:', error);
    return NextResponse.json({
      error: error.message || 'Failed to toggle archive status'
    }, { status: 500 });
  }
}
