import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify the current user is an admin
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

    // Get update data from request
    const body = await request.json();
    const { id, first_name, last_name, email, role, school_id } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // If role is coach, assistant_coach, or school_admin, school_id is required
    if ((role === 'coach' || role === 'assistant_coach' || role === 'school_admin') && !school_id) {
      return NextResponse.json({ error: `School is required for ${role === 'assistant_coach' ? 'assistant coaches' : role + 's'}` }, { status: 400 });
    }

    // Update the user record
    const { error: updateError } = await supabase
      .from('users')
      .update({
        first_name,
        last_name,
        email,
        role,
        school_id: (role === 'coach' || role === 'assistant_coach' || role === 'school_admin' || role === 'parent') ? school_id : null,
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Sync user_roles table: ensure the primary role exists
    const adminClient = createAdminClient();
    const { data: existingRoles } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', id);

    if (!existingRoles || existingRoles.length === 0) {
      // No roles yet — insert the primary role
      await adminClient.from('user_roles').insert({ user_id: id, role });
    } else if (!existingRoles.some((r) => r.role === role)) {
      // Primary role changed and new role isn't in the table — add it
      await adminClient.from('user_roles').insert({ user_id: id, role });
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({
      error: error.message || 'Failed to update user'
    }, { status: 500 });
  }
}
