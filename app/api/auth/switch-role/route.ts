import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getEffectiveUserId, getUserRoles } from '@/lib/auth';
import { cookies } from 'next/headers';
import { UserRole } from '@/lib/types';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { role } = body as { role: UserRole };

  if (!role) {
    return NextResponse.json({ error: 'role is required' }, { status: 400 });
  }

  // Use the effective user (handles impersonation)
  const effectiveUserId = await getEffectiveUserId();
  if (!effectiveUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the effective user actually holds this role
  const roles = await getUserRoles(effectiveUserId);
  if (!roles.includes(role)) {
    return NextResponse.json({ error: 'You do not hold this role' }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.set('active_role', role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // Session cookie — expires when browser closes
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return NextResponse.json({ role });
}
