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

    // Verify user is an admin or school admin
    const { data: adminData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', effectiveUserId)
      .single();

    const isAdmin = adminData?.role === 'admin';
    const isSchoolAdmin = adminData?.role === 'school_admin';

    if (!adminData || (!isAdmin && !isSchoolAdmin)) {
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

    // School admins can only view assistants from their school, admins can view all
    const school = Array.isArray(assistant.school) ? assistant.school[0] : assistant.school;
    if (isSchoolAdmin && school?.id !== adminData.school_id) {
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

    // Verify user is an admin or school admin
    const { data: adminData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', effectiveUserId)
      .single();

    const isAdmin = adminData?.role === 'admin';
    const isSchoolAdmin = adminData?.role === 'school_admin';

    if (!adminData || (!isAdmin && !isSchoolAdmin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the assistant and verify permissions
    const { data: assistant } = await supabase
      .from('users')
      .select('id, school_id, approval_status')
      .eq('id', id)
      .eq('role', 'assistant_coach')
      .single();

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // School admins can only modify assistants from their school, admins can modify all
    if (isSchoolAdmin && assistant.school_id !== adminData.school_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, status, reason } = body;

    // Support both old action-based API and new status-based API
    let newStatus: string;
    if (status) {
      // New API: directly set status
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status. Must be "pending", "approved", or "rejected"' }, { status: 400 });
      }
      newStatus = status;
    } else if (action) {
      // Legacy API: convert action to status
      if (!['approve', 'reject'].includes(action)) {
        return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject"' }, { status: 400 });
      }
      newStatus = action === 'approve' ? 'approved' : 'rejected';
    } else {
      return NextResponse.json({ error: 'Either status or action is required' }, { status: 400 });
    }

    const updateData: {
      approval_status: string;
      approved_by?: string | null;
      approved_at?: string | null;
      rejected_reason?: string | null;
    } = {
      approval_status: newStatus,
    };

    if (newStatus === 'approved') {
      updateData.approved_by = effectiveUserId || null;
      updateData.approved_at = new Date().toISOString();
      updateData.rejected_reason = null;
    } else if (newStatus === 'rejected') {
      updateData.rejected_reason = reason || null;
      // Keep approved_by/approved_at if previously approved, or clear if never approved
    } else {
      // pending - clear approval info
      updateData.approved_by = null;
      updateData.approved_at = null;
      updateData.rejected_reason = null;
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

    const statusMessages: Record<string, string> = {
      approved: 'Assistant coach has been approved',
      rejected: 'Assistant coach application has been rejected',
      pending: 'Assistant coach status has been set to pending',
    };

    return NextResponse.json({
      success: true,
      message: statusMessages[newStatus] || 'Status updated successfully',
    });
  } catch (error: unknown) {
    console.error('Error updating assistant status:', error);
    const message = error instanceof Error ? error.message : 'Failed to update assistant status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
