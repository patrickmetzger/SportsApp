import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

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

    // Get the userId from form data
    const formData = await request.formData();
    const userId = formData.get('userId') as string;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Archive the user
    const { error: archiveError } = await supabase
      .from('users')
      .update({ archived: true })
      .eq('id', userId);

    if (archiveError) {
      return NextResponse.json({ error: archiveError.message }, { status: 400 });
    }

    // Redirect back to users page
    return NextResponse.redirect(new URL('/admin/users', request.url));
  } catch (error: any) {
    console.error('Error archiving user:', error);
    return NextResponse.json({
      error: error.message || 'Failed to archive user'
    }, { status: 500 });
  }
}
