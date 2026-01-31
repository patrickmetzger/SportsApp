import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notifications';

// This endpoint is called by Vercel Cron
// It checks for expiring certifications and sends notifications

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (if configured)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get all active notification schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from('certification_notification_schedules')
      .select('*')
      .eq('is_active', true);

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ message: 'No active schedules', notifications_sent: 0 });
    }

    let totalNotifications = 0;

    for (const schedule of schedules) {
      // Calculate the target date for this schedule
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + schedule.days_before_expiry);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      // Get certifications expiring on this exact day
      // (we check for exact day to avoid duplicate notifications)
      let certsQuery = supabase
        .from('coach_certifications')
        .select(`
          id,
          coach_id,
          expiration_date,
          certification_type:certification_types(name),
          coach:users!coach_certifications_coach_id_fkey(
            id, email, first_name, last_name, school_id
          )
        `)
        .eq('expiration_date', targetDateStr);

      const { data: certs, error: certsError } = await certsQuery;

      if (certsError) {
        console.error('Error fetching certs:', certsError);
        continue;
      }

      if (!certs || certs.length === 0) {
        continue;
      }

      // Filter by school if this is a school-specific schedule
      let filteredCerts = certs;
      if (schedule.school_id) {
        filteredCerts = certs.filter(c => {
          const coach = Array.isArray(c.coach) ? c.coach[0] : c.coach;
          return coach?.school_id === schedule.school_id;
        });
      }

      for (const cert of filteredCerts) {
        // Handle nested objects that might be arrays
        const coach = Array.isArray(cert.coach) ? cert.coach[0] : cert.coach;
        const certType = Array.isArray(cert.certification_type) ? cert.certification_type[0] : cert.certification_type;

        // Check if we already sent this notification
        const { data: existingLog } = await supabase
          .from('certification_notification_logs')
          .select('id')
          .eq('coach_certification_id', cert.id)
          .eq('notification_schedule_id', schedule.id)
          .maybeSingle();

        if (existingLog) {
          continue; // Already sent
        }

        // Determine notification types to send
        const typesToSend: ('email' | 'in_app')[] = [];
        if (schedule.notification_type === 'email' || schedule.notification_type === 'both') {
          typesToSend.push('email');
        }
        if (schedule.notification_type === 'in_app' || schedule.notification_type === 'both') {
          typesToSend.push('in_app');
        }

        for (const notifType of typesToSend) {
          if (notifType === 'in_app' && coach?.id) {
            // Create in-app notification
            const title = schedule.days_before_expiry === 0
              ? 'Certification Expiring Today'
              : schedule.days_before_expiry < 0
                ? 'Certification Expired'
                : `Certification Expiring in ${schedule.days_before_expiry} Days`;

            const certName = certType?.name || 'A certification';
            const message = `${certName} expires on ${new Date(cert.expiration_date!).toLocaleDateString()}. Please renew it to stay compliant.`;

            await createNotification({
              supabase,
              userId: coach.id,
              type: schedule.days_before_expiry < 0 ? 'certification_expired' : 'certification_expiring',
              title,
              message,
              link: '/dashboard/coach/certifications',
            });

            // Log the notification
            await supabase
              .from('certification_notification_logs')
              .insert({
                coach_certification_id: cert.id,
                notification_schedule_id: schedule.id,
                notification_type: 'in_app',
              });

            totalNotifications++;
          }

          if (notifType === 'email' && coach?.email) {
            // TODO: Send email via Resend
            // For now, just log it
            console.log(`Would send email to ${coach.email} about expiring cert`);

            // Log the notification
            await supabase
              .from('certification_notification_logs')
              .insert({
                coach_certification_id: cert.id,
                notification_schedule_id: schedule.id,
                notification_type: 'email',
              });

            totalNotifications++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      notifications_sent: totalNotifications,
      schedules_processed: schedules.length,
    });
  } catch (error: unknown) {
    console.error('Cron job error:', error);
    const message = error instanceof Error ? error.message : 'Cron job failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}
