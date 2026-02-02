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

    // Create user via Supabase Auth
    const { data: newUser, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role,
        },
      },
    });

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    if (newUser.user) {
      const adminClient = createAdminClient();

      // Wait a moment for any trigger to fire
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if user record was created by trigger
      const { data: userRecord } = await adminClient
        .from('users')
        .select('*')
        .eq('id', newUser.user.id)
        .single();

      if (!userRecord) {
        // Trigger didn't fire, create manually
        await adminClient.from('users').insert({
          id: newUser.user.id,
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
          .eq('id', newUser.user.id);
      }
    }

    return NextResponse.json({
      success: true,
      user: newUser.user
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({
      error: error.message || 'Failed to create user'
    }, { status: 500 });
  }
}
