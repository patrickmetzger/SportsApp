import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';

export async function GET() {
  try {
    const supabase = await createClient();

    // Debug: Check what Supabase thinks the auth state is
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = await getEffectiveUserId();

    if (!effectiveUserId) {
      return NextResponse.json(
        { user: null, debug: { authUser, authError: authError?.message, effectiveUserId } },
        { status: 200 }
      );
    }

    // Fetch user details from users table
    const { data: userRecord, error: queryError } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name')
      .eq('id', effectiveUserId)
      .single();

    return NextResponse.json({
      user: userRecord || {
        id: effectiveUserId,
        email: null,
        role: null,
        first_name: null,
        last_name: null,
      },
      debug: {
        authUser: authUser?.id,
        authEmail: authUser?.email,
        effectiveUserId,
        queryError: queryError?.message,
        queryCode: queryError?.code,
      },
    });
  } catch (error: any) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { user: null, error: error.message },
      { status: 200 }
    );
  }
}
