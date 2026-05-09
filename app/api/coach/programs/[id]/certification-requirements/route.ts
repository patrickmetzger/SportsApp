import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectiveUserId, getUserRole } from '@/lib/auth';

// Helper to verify coach has access to program (uses adminClient to bypass RLS)
async function verifyCoachAccess(coachId: string, programId: string) {
  const adminClient = createAdminClient();

  const { data: program } = await adminClient
    .from('summer_programs')
    .select('id, submitted_by')
    .eq('id', programId)
    .single();

  if (!program) return false;
  if (program.submitted_by === coachId) return true;

  const { data: assignment } = await adminClient
    .from('program_coaches')
    .select('id')
    .eq('program_id', programId)
    .eq('coach_id', coachId)
    .maybeSingle();

  return !!assignment;
}

// GET - List certification requirements for a program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: programId } = await params;

    const effectiveUserId = await getEffectiveUserId();
    if (!effectiveUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = await getUserRole();
    if (role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const hasAccess = await verifyCoachAccess(effectiveUserId, programId);
    if (!hasAccess) return NextResponse.json({ error: 'You do not have access to this program' }, { status: 403 });

    // Use adminClient so RLS never silently drops locked/global requirements
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('program_certification_requirements')
      .select('*, certification_type:certification_types(*)')
      .eq('program_id', programId)
      .order('is_required', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ requirements: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch requirements';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Save certification requirements for a program (coach-editable ones only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: programId } = await params;

    const effectiveUserId = await getEffectiveUserId();
    if (!effectiveUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = await getUserRole();
    if (role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const hasAccess = await verifyCoachAccess(effectiveUserId, programId);
    if (!hasAccess) return NextResponse.json({ error: 'You do not have access to this program' }, { status: 403 });

    const body = await request.json();
    const { requirements } = body;
    if (!Array.isArray(requirements)) {
      return NextResponse.json({ error: 'Requirements must be an array' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Fetch all existing requirements via adminClient so locked ones are never missed
    const { data: existingReqs } = await adminClient
      .from('program_certification_requirements')
      .select('certification_type_id, is_required, locked_by_admin')
      .eq('program_id', programId);

    // Determine which cert type IDs are protected (locked by admin OR global cert already required)
    const { data: certTypes } = await adminClient
      .from('certification_types')
      .select('id, school_id')
      .in('id', (existingReqs || []).map((r: any) => r.certification_type_id));

    const globalCertIds = new Set((certTypes || []).filter((ct: any) => ct.school_id === null).map((ct: any) => ct.id));

    const protectedIds = new Set(
      (existingReqs || [])
        .filter((r: any) => r.locked_by_admin || globalCertIds.has(r.certification_type_id))
        .map((r: any) => r.certification_type_id)
    );

    // Only process requirements the coach is allowed to change
    const coachRequirements = requirements.filter(
      (r: { certification_type_id: string }) => !protectedIds.has(r.certification_type_id)
    );

    // Delete existing non-protected requirements, then re-insert
    await adminClient
      .from('program_certification_requirements')
      .delete()
      .eq('program_id', programId)
      .eq('locked_by_admin', false)
      .not('certification_type_id', 'in', `(${[...protectedIds].join(',')})`);

    if (coachRequirements.length > 0) {
      const { error } = await adminClient
        .from('program_certification_requirements')
        .insert(
          coachRequirements.map((req: { certification_type_id: string; is_required: boolean }) => ({
            program_id: programId,
            certification_type_id: req.certification_type_id,
            is_required: req.is_required ?? true,
            locked_by_admin: false,
          }))
        );
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save requirements';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
