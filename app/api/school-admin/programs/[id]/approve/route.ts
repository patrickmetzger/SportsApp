import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';
import { resend } from '@/lib/resend';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const effectiveUserId = await getEffectiveUserId();
    const { id } = await params;

    const { data: adminData } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', effectiveUserId)
      .single();

    if (!adminData || adminData.role !== 'school_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: program } = await supabase
      .from('summer_programs')
      .select('id, name, school_id, status, submitted_by')
      .eq('id', id)
      .single();

    if (!program) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (program.school_id !== adminData.school_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (program.status !== 'pending') {
      return NextResponse.json({ error: 'Program is not pending' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('summer_programs')
      .update({ status: 'approved', rejection_reason: null })
      .eq('id', id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

    // Email the submitting coach
    if (program.submitted_by) {
      const { data: coachData } = await supabase
        .from('users')
        .select('email, first_name')
        .eq('id', program.submitted_by)
        .single();

      if (coachData?.email) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@schoolsports.com',
          to: coachData.email,
          subject: `Your program "${program.name}" has been approved`,
          html: `
            <p>Hi ${coachData.first_name || 'Coach'},</p>
            <p>Great news! Your program <strong>${program.name}</strong> has been approved by your school administrator.</p>
            <p>The program is now live and open for registrations.</p>
            <p>Thank you,<br/>SchoolSports</p>
          `,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to approve program';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
