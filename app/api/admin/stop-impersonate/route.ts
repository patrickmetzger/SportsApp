import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  // Remove impersonation cookies
  const cookieStore = await cookies();
  cookieStore.delete('impersonated_user_id');
  cookieStore.delete('admin_user_id');

  // Redirect back to admin
  return NextResponse.redirect(new URL('/admin', request.url));
}
