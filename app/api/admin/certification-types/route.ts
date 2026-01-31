import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - List all certification types (global and all school-specific for admin)
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all certification types with school info
    const { data, error } = await supabase
      .from('certification_types')
      .select(`
        *,
        school:schools(id, name)
      `)
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

// POST - Create a global certification type (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, is_universal, validity_period_months } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Create global certification type (school_id = null)
    const { data, error } = await supabase
      .from('certification_types')
      .insert({
        name,
        description: description || null,
        school_id: null, // Global type
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
