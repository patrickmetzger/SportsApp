import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: currentUserData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (!currentUserData || currentUserData.role !== 'school_admin' || !currentUserData.school_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // At this point, currentUserData is guaranteed to be non-null
    const userData = currentUserData;

    const body = await request.json();
    const { id, name, address, city, state, zip_code, phone, email, website, logo_url, primary_color, secondary_color } = body;

    if (!id) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
    }

    // Verify the school being edited is the school admin's school
    if (id !== userData.school_id) {
      return NextResponse.json({ error: 'Can only update your own school' }, { status: 403 });
    }

    if (!name) {
      return NextResponse.json({ error: 'School name is required' }, { status: 400 });
    }

    // Update school record
    const { error: updateError } = await supabase
      .from('schools')
      .update({
        name,
        address,
        city,
        state,
        zip_code,
        phone,
        email,
        website,
        logo_url,
        primary_color,
        secondary_color,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'School updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating school:', error);
    return NextResponse.json({
      error: error.message || 'Failed to update school'
    }, { status: 500 });
  }
}
