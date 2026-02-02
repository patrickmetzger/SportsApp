import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName } = body;

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
    }

    // Check if user record exists in public.users
    const { data: existingUser } = await adminClient
      .from('users')
      .select('id, role, school_id')
      .eq('id', user.id)
      .single();

    // Get role and school_id from existing record or user metadata
    const role = existingUser?.role || user.user_metadata?.role || null;
    const schoolId = existingUser?.school_id || user.user_metadata?.school_id || null;

    if (existingUser) {
      // Update existing user record
      const { error: updateError } = await adminClient
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          // Preserve or set role/school_id from metadata if not already set
          ...(role && !existingUser.role ? { role } : {}),
          ...(schoolId && !existingUser.school_id ? { school_id: schoolId } : {}),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.json({ error: 'Failed to update user record' }, { status: 500 });
      }
    } else {
      // Create new user record if it doesn't exist
      const { error: insertError } = await adminClient
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          role: role,
          school_id: schoolId,
        });

      if (insertError) {
        console.error('Error creating user:', insertError);
        return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in setup:', error);
    return NextResponse.json({
      error: error.message || 'Failed to setup account'
    }, { status: 500 });
  }
}
