import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify the current user is a school admin
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: currentUserData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (currentUserData?.role !== 'school_admin' || !currentUserData.school_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get invite data from request
    const body = await request.json();
    const { email, role, school_id } = body;

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    // Validate role
    if (!['coach', 'parent', 'school_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Validate school_id matches current user's school
    if (!school_id || school_id !== currentUserData.school_id) {
      return NextResponse.json({ error: 'Can only invite users to your school' }, { status: 403 });
    }

    // Send invitation email using Supabase
    const { data: inviteData, error: inviteError } = await supabase.auth.signUp({
      email,
      password: Math.random().toString(36).slice(-12), // Temporary password
      options: {
        data: {
          role: role,
          school_id: school_id,
          invited: true,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/setup`,
      },
    });

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }

    // Create a pending user record with school_id
    if (inviteData.user) {
      const { error: userInsertError } = await supabase.from('users').upsert({
        id: inviteData.user.id,
        email,
        role,
        first_name: '',
        last_name: '',
        school_id: school_id,
      }, {
        onConflict: 'id'
      });

      if (userInsertError) {
        console.error('Error creating user record:', userInsertError);
        return NextResponse.json({
          error: 'Failed to create user record: ' + userInsertError.message
        }, { status: 500 });
      }

      console.log('User record created with school_id:', school_id);
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
    });
  } catch (error: any) {
    console.error('Error sending invite:', error);
    return NextResponse.json({
      error: error.message || 'Failed to send invite'
    }, { status: 500 });
  }
}
