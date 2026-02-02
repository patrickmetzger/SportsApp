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

    // Get invite data from request
    const body = await request.json();
    const { email, role, school_id } = body;

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    // Validate school_id for coach, assistant_coach, and school_admin roles
    if ((role === 'coach' || role === 'assistant_coach' || role === 'school_admin') && !school_id) {
      return NextResponse.json({ error: 'School is required for coaches, assistant coaches, and school admins' }, { status: 400 });
    }

    // Send invitation email using Supabase
    // Note: This uses the regular auth.signUp with email confirmation
    // The user will receive an email to confirm and set their password
    const { data: inviteData, error: inviteError } = await supabase.auth.signUp({
      email,
      password: Math.random().toString(36).slice(-12), // Temporary password
      options: {
        data: {
          role: role,
          invited: true,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/setup`,
      },
    });

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }

    // Create a pending user record using admin client to bypass RLS
    if (inviteData.user) {
      const adminClient = createAdminClient();

      // Try to insert, if user exists, update instead
      const { error: insertError } = await adminClient.from('users').insert({
        id: inviteData.user.id,
        email,
        role,
        first_name: '',
        last_name: '',
        school_id: school_id || null,
      });

      // If insert failed due to duplicate, update the existing record
      if (insertError && insertError.code === '23505') {
        const { error: updateError } = await adminClient
          .from('users')
          .update({
            role,
            school_id: school_id || null,
          })
          .eq('id', inviteData.user.id);

        if (updateError) {
          console.error('Error updating existing user:', updateError);
          return NextResponse.json({ error: 'Failed to update user record' }, { status: 500 });
        }
      } else if (insertError) {
        console.error('Error creating user record:', insertError);
        return NextResponse.json({ error: 'Failed to create user record: ' + insertError.message }, { status: 500 });
      }
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
