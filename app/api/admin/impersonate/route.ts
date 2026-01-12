import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Verify the current user is an admin
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { data: currentUserData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (currentUserData?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Get the user ID to impersonate from form data
  const formData = await request.formData();
  const userIdToImpersonate = formData.get('userId') as string;

  if (!userIdToImpersonate) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  // Verify the target user exists
  const { data: targetUser } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('id', userIdToImpersonate)
    .single();

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Store the impersonation in cookies
  const cookieStore = await cookies();
  cookieStore.set('impersonated_user_id', userIdToImpersonate, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
  });
  cookieStore.set('admin_user_id', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  // Redirect to the dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
