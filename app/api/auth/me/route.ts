import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the effective user ID (handles impersonation)
    const effectiveUserId = await getEffectiveUserId();

    if (!effectiveUserId) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      );
    }

    // Fetch user details from users table
    const { data: userRecord } = await supabase
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
    });
  } catch (error: any) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { user: null },
      { status: 200 }
    );
  }
}
