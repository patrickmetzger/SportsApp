import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';
import { getCoachComplianceStatus } from '@/lib/certifications';

// GET - Get coach's compliance status across all assigned programs
export async function GET() {
  try {
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

    const complianceStatus = await getCoachComplianceStatus(supabase, effectiveUserId);

    // Calculate overall status
    const overallCompliant = complianceStatus.every(s => s.isCompliant);
    const totalMissingRequired = complianceStatus.reduce((sum, s) => sum + s.missingRequired.length, 0);
    const totalExpiringCerts = complianceStatus.reduce((sum, s) => sum + s.expiringCerts.length, 0);

    return NextResponse.json({
      programs: complianceStatus,
      summary: {
        isCompliant: overallCompliant,
        totalPrograms: complianceStatus.length,
        compliantPrograms: complianceStatus.filter(s => s.isCompliant).length,
        totalMissingRequired,
        totalExpiringCerts,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching compliance status:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch compliance status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
