import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - List certification requirements for a program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: programId } = await params;
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

    const { data, error } = await supabase
      .from('program_certification_requirements')
      .select(`
        *,
        certification_type:certification_types(*)
      `)
      .eq('program_id', programId)
      .order('is_required', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ requirements: data });
  } catch (error: unknown) {
    console.error('Error fetching requirements:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch requirements';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Add certification requirements to a program
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: programId } = await params;
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
    const { requirements } = body; // Array of { certification_type_id, is_required }

    if (!Array.isArray(requirements)) {
      return NextResponse.json({ error: 'Requirements must be an array' }, { status: 400 });
    }

    // Delete existing requirements
    await supabase
      .from('program_certification_requirements')
      .delete()
      .eq('program_id', programId);

    // Insert new requirements
    if (requirements.length > 0) {
      const inserts = requirements.map((req: { certification_type_id: string; is_required: boolean; locked_by_admin?: boolean }) => ({
        program_id: programId,
        certification_type_id: req.certification_type_id,
        is_required: req.is_required ?? true,
        locked_by_admin: req.locked_by_admin ?? false,
      }));

      const { error } = await supabase
        .from('program_certification_requirements')
        .insert(inserts);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error saving requirements:', error);
    const message = error instanceof Error ? error.message : 'Failed to save requirements';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
