import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectiveUserId } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: programId } = await params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ children: [] });
    }

    const effectiveUserId = await getEffectiveUserId();

    // Fetch active registrations for this program (exclude cancelled/refund_requested)
    const adminClient = createAdminClient();
    const { data: registrations, error } = await adminClient
      .from('program_registrations')
      .select('id, student_name, student_id')
      .eq('program_id', programId)
      .eq('parent_user_id', effectiveUserId)
      .not('status', 'in', '("cancelled","refund_requested")');

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ children: registrations || [] });
  } catch (error: any) {
    console.error('Error fetching registered children:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch registered children' },
      { status: 500 }
    );
  }
}
