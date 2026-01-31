import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Get a single certification type (global or school-specific)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data, error } = await supabase
      .from('certification_types')
      .select(`
        *,
        school:schools(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Verify access: global types or types from this school
    if (data.school_id && data.school_id !== userData.school_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ certificationType: data });
  } catch (error: unknown) {
    console.error('Error fetching certification type:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch certification type';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT - Update a school-specific certification type (cannot modify global types)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check if this is a school-specific type from this school
    const { data: existingType } = await supabase
      .from('certification_types')
      .select('school_id')
      .eq('id', id)
      .single();

    if (!existingType) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (!existingType.school_id || existingType.school_id !== userData.school_id) {
      return NextResponse.json({ error: 'Cannot modify global or other schools certification types' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, is_universal, validity_period_months } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('certification_types')
      .update({
        name,
        description: description || null,
        is_universal: is_universal ?? false,
        validity_period_months: validity_period_months ?? 12,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, certificationType: data });
  } catch (error: unknown) {
    console.error('Error updating certification type:', error);
    const message = error instanceof Error ? error.message : 'Failed to update certification type';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE - Delete a school-specific certification type (cannot delete global types)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check if this is a school-specific type from this school
    const { data: existingType } = await supabase
      .from('certification_types')
      .select('school_id')
      .eq('id', id)
      .single();

    if (!existingType) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (!existingType.school_id || existingType.school_id !== userData.school_id) {
      return NextResponse.json({ error: 'Cannot delete global or other schools certification types' }, { status: 403 });
    }

    const { error } = await supabase
      .from('certification_types')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting certification type:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete certification type';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
