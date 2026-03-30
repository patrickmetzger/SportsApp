import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
      .select('role')
      .eq('id', user.id)
      .single();

    if (currentUserData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the user data from the request
    const body = await request.json();
    const { email, password, firstName, lastName, role, school_id } = body;

    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If role is coach, assistant_coach, or school_admin, school_id is required
    if ((role === 'coach' || role === 'assistant_coach' || role === 'school_admin') && !school_id) {
      return NextResponse.json({ error: `School is required for ${role === 'assistant_coach' ? 'assistant coaches' : role + 's'}` }, { status: 400 });
    }

    // Create the user using admin API (bypasses email rate limits)
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

    // Create the user record using admin client to bypass RLS
    if (authUser) {
      // Wait a moment for any trigger to fire
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: userRecord } = await adminClient
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!userRecord) {
        // If trigger didn't work, create manually
        await adminClient.from('users').insert({
          id: authUser.id,
          email,
          role,
          first_name: firstName,
          last_name: lastName,
          school_id: (role === 'coach' || role === 'assistant_coach' || role === 'school_admin' || role === 'parent') ? school_id : null,
        });
      } else if ((role === 'coach' || role === 'assistant_coach' || role === 'school_admin' || role === 'parent') && school_id) {
        // Update the school_id if user was created by trigger
        await adminClient
          .from('users')
          .update({ school_id, role, first_name: firstName, last_name: lastName })
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
