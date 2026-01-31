import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';

// Helper to verify coach has access to program
async function verifyCoachAccess(supabase: any, coachId: string, programId: string) {
  // Check if coach created the program
  const { data: program } = await supabase
    .from('summer_programs')
    .select('id, created_by')
    .eq('id', programId)
    .single();

  if (!program) return false;

  if (program.created_by === coachId) return true;

  // Check if coach is assigned to the program
  const { data: assignment } = await supabase
    .from('program_coaches')
    .select('id')
    .eq('program_id', programId)
    .eq('coach_id', coachId)
    .single();

  return !!assignment;
}

// GET - List certification requirements for a program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: programId } = await params;
    const supabase = await createClient();

    // Verify user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId();
    if (!effectiveUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', effectiveUserId)
      .single();

    if (!userData || userData.role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify coach has access to this program
    const hasAccess = await verifyCoachAccess(supabase, effectiveUserId, programId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'You do not have access to this program' }, { status: 403 });
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

    // Verify user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId();
    if (!effectiveUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!userData || userData.role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify coach has access to this program
    const hasAccess = await verifyCoachAccess(supabase, effectiveUserId, programId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'You do not have access to this program' }, { status: 403 });
    }

    const body = await request.json();
    const { requirements } = body; // Array of { certification_type_id, is_required }

    if (!Array.isArray(requirements)) {
      return NextResponse.json({ error: 'Requirements must be an array' }, { status: 400 });
    }

    // Get existing locked requirements (these cannot be modified by coaches)
    const { data: existingReqs } = await supabase
      .from('program_certification_requirements')
      .select('certification_type_id, is_required, locked_by_admin')
      .eq('program_id', programId);

    const lockedReqs = (existingReqs || []).filter(r => r.locked_by_admin);
    const lockedCertTypeIds = new Set(lockedReqs.map(r => r.certification_type_id));

    // Filter out any attempts to modify locked requirements
    const coachRequirements = requirements.filter(
      (r: { certification_type_id: string }) => !lockedCertTypeIds.has(r.certification_type_id)
    );

    // Verify all certification types are valid (global or from coach's school)
    if (coachRequirements.length > 0) {
      const certTypeIds = coachRequirements.map((r: { certification_type_id: string }) => r.certification_type_id);

      const { data: validCertTypes } = await supabase
        .from('certification_types')
        .select('id')
        .or(`school_id.is.null,school_id.eq.${userData.school_id}`)
        .in('id', certTypeIds);

      const validIds = new Set(validCertTypes?.map(c => c.id) || []);
      const invalidIds = certTypeIds.filter((id: string) => !validIds.has(id));

      if (invalidIds.length > 0) {
        return NextResponse.json({
          error: 'Some certification types are not available for your school'
        }, { status: 400 });
      }
    }

    // Delete only non-locked requirements (preserve locked ones)
    await supabase
      .from('program_certification_requirements')
      .delete()
      .eq('program_id', programId)
      .eq('locked_by_admin', false);

    // Insert coach's requirements (non-locked)
    if (coachRequirements.length > 0) {
      const inserts = coachRequirements.map((req: { certification_type_id: string; is_required: boolean }) => ({
        program_id: programId,
        certification_type_id: req.certification_type_id,
        is_required: req.is_required ?? true,
        locked_by_admin: false, // Coach-added requirements are never locked
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
