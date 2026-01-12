import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, email, role, school_id } = body;

    if (!user_id || !email || !role) {
      return NextResponse.json({ error: 'user_id, email, and role are required' }, { status: 400 });
    }

    // First, check if user exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();

    if (existingUser) {
      // User exists, update it
      const { error: updateError } = await supabase
        .from('users')
        .update({
          role,
          school_id: school_id || null,
        })
        .eq('id', user_id);

      if (updateError) {
        console.error('Update error:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'User role updated successfully',
      });
    } else {
      // User doesn't exist, insert it
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user_id,
          email,
          role,
          first_name: '',
          last_name: '',
          school_id: school_id || null,
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'User record created successfully',
      });
    }
  } catch (error: any) {
    console.error('Error fixing user role:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fix user role'
    }, { status: 500 });
  }
}
