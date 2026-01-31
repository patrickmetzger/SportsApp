import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - List global + school-specific certification types
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'school_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!userData.school_id) {
      return NextResponse.json({ error: 'No school assigned' }, { status: 400 });
    }

    // Get global types (school_id is null) and school-specific types
    const { data, error } = await supabase
      .from('certification_types')
      .select(`
        *,
        school:schools(id, name)
      `)
      .or(`school_id.is.null,school_id.eq.${userData.school_id}`)
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ certificationTypes: data });
  } catch (error: unknown) {
    console.error('Error fetching certification types:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch certification types';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Create a school-specific certification type
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'school_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!userData.school_id) {
      return NextResponse.json({ error: 'No school assigned' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, is_universal, validity_period_months } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Create school-specific certification type
    const { data, error } = await supabase
      .from('certification_types')
      .insert({
        name,
        description: description || null,
        school_id: userData.school_id, // School-specific type
        is_universal: is_universal ?? false,
        validity_period_months: validity_period_months ?? 12,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, certificationType: data });
  } catch (error: unknown) {
    console.error('Error creating certification type:', error);
    const message = error instanceof Error ? error.message : 'Failed to create certification type';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
