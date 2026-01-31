import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Clear any impersonation cookies
  const cookieStore = await cookies();
  cookieStore.delete('impersonated_user_id');
  cookieStore.delete('admin_user_id');

  // Use the request URL to get the correct origin for redirect
  const url = new URL('/login', request.url);
  return NextResponse.redirect(url);
}
