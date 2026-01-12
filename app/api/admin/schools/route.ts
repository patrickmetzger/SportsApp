import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Verify admin
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

    // Fetch all schools
    const { data: schools, error } = await supabase
      .from('schools')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ schools });
  } catch (error: any) {
    console.error('Fetch schools error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch schools' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin
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

    const body = await request.json();
    const {
      name,
      address,
      city,
      state,
      zip_code,
      phone,
      email,
      principal_name,
      athletic_director_name,
      notes,
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'School name is required' },
        { status: 400 }
      );
    }

    // Create school
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .insert({
        name,
        address,
        city,
        state,
        zip_code,
        phone,
        email,
        principal_name,
        athletic_director_name,
        notes,
      })
      .select()
      .single();

    if (schoolError) {
      return NextResponse.json(
        { error: schoolError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      school,
    });
  } catch (error: any) {
    console.error('Create school error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create school' },
      { status: 500 }
    );
  }
}
