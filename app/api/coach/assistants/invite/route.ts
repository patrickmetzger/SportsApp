import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectiveUserId } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const effectiveUserId = await getEffectiveUserId();

    if (!effectiveUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is a coach and get their school
    const { data: coachData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', effectiveUserId)
      .single();

    if (coachData?.role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden: Only coaches can invite assistants' }, { status: 403 });
    }

    const body = await request.json();
    const { email, firstName, lastName } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await adminClient
      .from('users')
      .select('id, role')
      .eq('email', email)
      .single();

    if (existingUser) {
      // If user exists and is already an assistant coach, just assign them
      if (existingUser.role === 'assistant_coach') {
        // Check if already assigned
        const { data: existingAssignment } = await supabase
          .from('coach_assistants')
          .select('id')
          .eq('coach_id', effectiveUserId)
          .eq('assistant_id', existingUser.id)
          .single();

        if (existingAssignment) {
          return NextResponse.json({ error: 'This assistant is already assigned to you' }, { status: 400 });
        }

        // Assign the existing assistant
        const { error: assignError } = await adminClient
          .from('coach_assistants')
          .insert({
            coach_id: effectiveUserId,
            assistant_id: existingUser.id,
            created_by: effectiveUserId,
          });

        if (assignError) {
          console.error('Error assigning assistant:', assignError);
          return NextResponse.json({ error: 'Failed to assign assistant' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Existing assistant coach has been assigned to you',
          assigned: true,
        });
      } else {
        return NextResponse.json({
          error: `This email is already registered with role: ${existingUser.role}`
        }, { status: 400 });
      }
    }

    // Create new user via Supabase Auth
    const { data: inviteData, error: inviteError } = await supabase.auth.signUp({
      email,
      password: Math.random().toString(36).slice(-12), // Temporary password
      options: {
        data: {
          role: 'assistant_coach',
          school_id: coachData.school_id,
          invited_by: effectiveUserId,
          first_name: firstName || '',
          last_name: lastName || '',
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/setup`,
      },
    });

    if (inviteError) {
      console.error('Error sending invite:', inviteError);
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }

    // Create the user record with pending approval status
    if (inviteData.user) {
      const { error: insertError } = await adminClient.from('users').insert({
        id: inviteData.user.id,
        email,
        role: 'assistant_coach',
        first_name: firstName || '',
        last_name: lastName || '',
        school_id: coachData.school_id,
        approval_status: 'pending',
      });

      if (insertError && insertError.code !== '23505') {
        console.error('Error creating user record:', insertError);
        return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
      }

      // Automatically assign the new assistant to this coach
      const { error: assignError } = await adminClient
        .from('coach_assistants')
        .insert({
          coach_id: effectiveUserId,
          assistant_id: inviteData.user.id,
          created_by: effectiveUserId,
        });

      if (assignError) {
        console.error('Error assigning assistant:', assignError);
        // Don't fail the request, the user was created successfully
      }

      // Create notification for school admins about pending approval
      if (coachData.school_id) {
        const { error: notificationError } = await adminClient
          .from('assistant_approval_notifications')
          .insert({
            assistant_id: inviteData.user.id,
            school_id: coachData.school_id,
          });

        if (notificationError) {
          console.error('Error creating approval notification:', notificationError);
          // Don't fail the request, notification is non-critical
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully. The assistant will be automatically assigned to you.',
    });
  } catch (error: any) {
    console.error('Error inviting assistant:', error);
    return NextResponse.json({
      error: error.message || 'Failed to send invite'
    }, { status: 500 });
  }
}
