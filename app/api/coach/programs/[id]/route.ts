import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const effectiveUserId = await getEffectiveUserId();

    // Resolve params promise
    const { id } = await params;

    // Verify program ownership and editability
    const { data: program } = await supabase
      .from('summer_programs')
      .select('id, status, submitted_by')
      .eq('id', id)
      .single();

    if (!program) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (program.submitted_by !== effectiveUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!['pending', 'rejected'].includes(program.status)) {
      return NextResponse.json({ error: 'Cannot edit an approved program' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      description,
      start_date,
      end_date,
      registration_deadline,
      cost,
      header_image_url,
      program_image_url,
    } = body;

    const { data: updated, error } = await supabase
      .from('summer_programs')
      .update({
        name,
        description,
        start_date,
        end_date,
        registration_deadline,
        cost: parseFloat(cost),
        header_image_url: header_image_url || null,
        program_image_url: program_image_url || null,
        status: 'pending',
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ program: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update program';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
