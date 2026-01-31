import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/auth';
import { getCoachComplianceStatus, getCertificationStatus } from '@/lib/certifications';
import { createNotification, NotificationType } from '@/lib/notifications';

// POST - Generate certification notifications for the coach
export async function POST() {
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

    // Get compliance status
    const complianceStatus = await getCoachComplianceStatus(supabase, effectiveUserId);

    // Get existing unread certification notifications to avoid duplicates
    const { data: existingNotifications } = await supabase
      .from('notifications')
      .select('id, type, title, message')
      .eq('user_id', effectiveUserId)
      .eq('read', false)
      .in('type', ['certification_missing', 'certification_expiring', 'certification_expired']);

    const existingKeys = new Set(
      existingNotifications?.map(n => `${n.type}:${n.title}:${n.message}`) || []
    );

    let notificationsCreated = 0;

    for (const status of complianceStatus) {
      // Create notifications for missing required certifications
      for (const missingCert of status.missingRequired) {
        const notificationType: NotificationType = 'certification_missing';
        const title = 'Missing Certification Required';
        const message = `${missingCert.name} is required for ${status.programName}`;
        const key = `${notificationType}:${title}:${message}`;

        if (!existingKeys.has(key)) {
          await createNotification({
            supabase,
            userId: effectiveUserId,
            type: notificationType,
            title,
            message,
            link: '/dashboard/coach/certifications',
          });
          existingKeys.add(key);
          notificationsCreated++;
        }
      }

      // Create notifications for expiring/expired certifications
      for (const expiringCert of status.expiringCerts) {
        const certStatus = getCertificationStatus(expiringCert.expiration_date);
        const certName = expiringCert.certification_type?.name || 'Certification';

        let notificationType: NotificationType;
        let title: string;
        let message: string;

        if (certStatus === 'expired') {
          notificationType = 'certification_expired';
          title = 'Certification Expired';
          message = `${certName} has expired and needs renewal`;
        } else {
          notificationType = 'certification_expiring';
          title = 'Certification Expiring Soon';
          const expDate = new Date(expiringCert.expiration_date!);
          message = `${certName} expires on ${expDate.toLocaleDateString()}`;
        }

        const key = `${notificationType}:${title}:${message}`;

        if (!existingKeys.has(key)) {
          await createNotification({
            supabase,
            userId: effectiveUserId,
            type: notificationType,
            title,
            message,
            link: '/dashboard/coach/certifications',
          });
          existingKeys.add(key);
          notificationsCreated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      notificationsCreated,
    });
  } catch (error: unknown) {
    console.error('Error generating certification notifications:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate notifications';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
