import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const VALID_ROLES = ['admin', 'school_admin', 'coach', 'assistant_coach', 'parent', 'student'];

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

    const body = await request.json();
    const { userId, roles } = body as { userId: string; roles: string[] };

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json({ error: 'At least one role is required' }, { status: 400 });
    }

    // Validate all roles
    for (const role of roles) {
      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 });
      }
    }

    const adminClient = createAdminClient();

    // Delete existing roles for this user
    const { error: deleteError } = await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    // Insert new roles
    const roleRows = roles.map((role) => ({
      user_id: userId,
      role,
    }));

    const { error: insertError } = await adminClient
      .from('user_roles')
      .insert(roleRows);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, roles });
  } catch (error: any) {
    console.error('Error updating user roles:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user roles' },
      { status: 500 }
    );
  }
}
