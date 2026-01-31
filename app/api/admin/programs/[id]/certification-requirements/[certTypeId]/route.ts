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
