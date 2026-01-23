import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Use the request URL to get the correct origin for redirect
  const url = new URL('/login', request.url);
  return NextResponse.redirect(url);
}
