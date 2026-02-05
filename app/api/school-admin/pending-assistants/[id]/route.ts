import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectiveUserId } from '@/lib/auth';

// GET - Get details of a specific pending assistant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId();

    // Verify user is a school admin
    const { data: adminData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!adminData || adminData.role !== 'school_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the assistant details
    const { data: assistant, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        approval_status,
        rejected_reason,
        created_at,
        school:school_id(id, name)
      `)
      .eq('id', id)
      .eq('role', 'assistant_coach')
      .single();

    if (error || !assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Verify the assistant belongs to the same school
    const school = Array.isArray(assistant.school) ? assistant.school[0] : assistant.school;
    if (school?.id !== adminData.school_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get certifications
    const { data: certifications } = await supabase
      .from('coach_certifications')
      .select(`
        *,
        certification_type:certification_types(*)
      `)
      .eq('coach_id', id)
      .order('created_at', { ascending: false });

    // Get inviting coach info
    const { data: coachAssignment } = await supabase
      .from('coach_assistants')
      .select(`
        created_at,
        coach:coach_id(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('assistant_id', id)
      .single();

    return NextResponse.json({
      assistant: {
        ...assistant,
        certifications: certifications || [],
        invited_by_coach: coachAssignment?.coach || null,
        invited_at: coachAssignment?.created_at || null,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching assistant details:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch assistant details';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT - Approve or reject an assistant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId();

    // Verify user is a school admin
    const { data: adminData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!adminData || adminData.role !== 'school_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the assistant and verify they belong to the same school
    const { data: assistant } = await supabase
      .from('users')
      .select('id, school_id, approval_status')
      .eq('id', id)
      .eq('role', 'assistant_coach')
      .single();

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    if (assistant.school_id !== adminData.school_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, reason } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject"' }, { status: 400 });
    }

    const updateData: {
      approval_status: string;
      approved_by?: string | null;
      approved_at?: string;
      rejected_reason?: string | null;
    } = {
      approval_status: action === 'approve' ? 'approved' : 'rejected',
    };

    if (action === 'approve') {
      updateData.approved_by = effectiveUserId || null;
      updateData.approved_at = new Date().toISOString();
      updateData.rejected_reason = null;
    } else {
      updateData.rejected_reason = reason || null;
    }

    const { error: updateError } = await adminClient
      .from('users')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating assistant status:', updateError);
      return NextResponse.json({ error: 'Failed to update assistant status' }, { status: 500 });
    }

    // Mark the notification as read
    await adminClient
      .from('assistant_approval_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('assistant_id', id);

    return NextResponse.json({
      success: true,
      message: action === 'approve'
        ? 'Assistant coach has been approved'
        : 'Assistant coach application has been rejected',
    });
  } catch (error: unknown) {
    console.error('Error updating assistant status:', error);
    const message = error instanceof Error ? error.message : 'Failed to update assistant status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
