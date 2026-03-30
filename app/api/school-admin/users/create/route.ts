import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
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
    const { email, password, firstName, lastName, phone, role, school_id } = body;

    // Validate role
    if (!['coach', 'assistant_coach', 'parent', 'school_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Validate school_id matches current user's school
    if (school_id !== userData.school_id) {
      return NextResponse.json({ error: 'Can only create users for your school' }, { status: 403 });
    }

    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create user using admin API (bypasses email rate limits)
    const adminClient = createAdminClient();

    const { data: adminUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: role,
      },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    const authUser = adminUser.user;

    if (authUser) {
      // Wait a moment for any trigger to fire
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if user record was created by trigger
      const { data: userRecord } = await adminClient
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!userRecord) {
        // Trigger didn't fire, create manually
        await adminClient.from('users').insert({
          id: authUser.id,
          email,
          role,
          first_name: firstName,
          last_name: lastName,
          phone,
          school_id,
        });
      } else {
        // Update with additional fields
        await adminClient
          .from('users')
          .update({ school_id, phone, role, first_name: firstName, last_name: lastName })
          .eq('id', authUser.id);
      }
    }

    return NextResponse.json({
      success: true,
      user: authUser,
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({
      error: error.message || 'Failed to create user'
    }, { status: 500 });
  }
}
