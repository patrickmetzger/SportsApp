import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// DELETE - Remove a certification requirement from a program
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; certTypeId: string }> }
) {
  try {
    const { id: programId, certTypeId } = await params;
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

    // Verify program belongs to this school
    const { data: program } = await supabase
      .from('summer_programs')
      .select('school_id')
      .eq('id', programId)
      .single();

    if (!program || program.school_id !== userData.school_id) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('program_certification_requirements')
      .delete()
      .eq('program_id', programId)
      .eq('certification_type_id', certTypeId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting requirement:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete requirement';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
