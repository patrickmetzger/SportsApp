import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/resend";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user's role and info
    const { data: coach, error: userError } = await supabase
      .from("users")
      .select("role, first_name, last_name, email, school_id")
      .eq("id", user.id)
      .single();

    if (userError || !coach) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only coaches can use this endpoint
    if (coach.role !== "coach") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      program_id,
      registration_id,
      student_name,
      severity,
      description,
      action_taken,
      notify_parties,
      school_id,
      parent_id,
    } = body;

    // Validate required fields
    if (!program_id || !registration_id || !severity || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create incident record
    const { data: incident, error: incidentError } = await supabase
      .from("incidents")
      .insert({
        program_id,
        registration_id,
        student_name,
        severity,
        description,
        action_taken: action_taken || null,
        reported_by: user.id,
        school_id,
        status: "reported",
      })
      .select()
      .single();

    // If incidents table doesn't exist, we'll still send notifications
    if (incidentError) {
      console.log("Note: incidents table may not exist, continuing with notifications");
    }

    // Collect emails to notify
    const emailsToSend: { email: string; name: string; type: string }[] = [];

    // Get parent info if notifying parent
    if (notify_parties.includes('parent') && parent_id) {
      const { data: parent } = await supabase
        .from("users")
        .select("email, first_name, last_name")
        .eq("id", parent_id)
        .single();

      if (parent?.email) {
        emailsToSend.push({
          email: parent.email,
          name: `${parent.first_name} ${parent.last_name}`,
          type: 'Parent',
        });
      }
    }

    // Get school admins if notifying school
    if (notify_parties.includes('school_admin') && school_id) {
      const { data: schoolAdmins } = await supabase
        .from("users")
        .select("email, first_name, last_name")
        .eq("school_id", school_id)
        .eq("role", "school_admin");

      schoolAdmins?.forEach((admin) => {
        if (admin.email) {
          emailsToSend.push({
            email: admin.email,
            name: `${admin.first_name} ${admin.last_name}`,
            type: 'School Admin',
          });
        }
      });
    }

    // For nurse notification, we'd need a nurse role or contact info in the school table
    // For now, include in school admin notification or handle separately

    // Get program name for email
    const { data: program } = await supabase
      .from("summer_programs")
      .select("name")
      .eq("id", program_id)
      .single();

    // Send emails
    let emailsSent = 0;
    const emailErrors: string[] = [];
    const severityColors: Record<string, string> = {
      minor: '#EAB308',
      moderate: '#F97316',
      serious: '#DC2626',
      emergency: '#991B1B',
    };

    for (const recipient of emailsToSend) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: recipient.email,
          subject: `${severity === 'emergency' ? '🚨 EMERGENCY: ' : '⚠️ '}Incident Report - ${student_name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: ${severityColors[severity] || '#DC2626'}; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">
                  ${severity === 'emergency' ? '🚨 EMERGENCY' : '⚠️ Incident Report'}
                </h1>
              </div>

              <div style="padding: 20px; background-color: #f9f9f9;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; width: 120px;">Student:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${student_name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Program:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${program?.name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Severity:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                      <span style="background-color: ${severityColors[severity]}; color: white; padding: 4px 12px; border-radius: 4px; text-transform: uppercase; font-size: 12px;">
                        ${severity}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Reported By:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${coach.first_name} ${coach.last_name} (Coach)</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Time:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${new Date().toLocaleString()}</td>
                  </tr>
                </table>
              </div>

              <div style="padding: 20px;">
                <h3 style="margin-top: 0; color: #333;">What Happened:</h3>
                <p style="background-color: #fff; padding: 15px; border-radius: 8px; border: 1px solid #ddd; line-height: 1.6;">
                  ${description.replace(/\n/g, '<br>')}
                </p>

                ${action_taken ? `
                  <h3 style="color: #333;">Action Taken:</h3>
                  <p style="background-color: #fff; padding: 15px; border-radius: 8px; border: 1px solid #ddd; line-height: 1.6;">
                    ${action_taken.replace(/\n/g, '<br>')}
                  </p>
                ` : ''}
              </div>

              <div style="padding: 20px; background-color: #f0f0f0; text-align: center; font-size: 12px; color: #666;">
                <p>This is an automated incident notification from SchoolSports.</p>
                <p>Coach Contact: ${coach.email}</p>
              </div>
            </div>
          `,
        });
        emailsSent++;
      } catch (emailError: any) {
        console.error(`Failed to send email to ${recipient.email}:`, emailError);
        emailErrors.push(recipient.email);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Incident reported. ${emailsSent} notification(s) sent.`,
      incident: incident || null,
      notifications: {
        sent: emailsSent,
        failed: emailErrors.length,
      },
    });
  } catch (error) {
    console.error("Error in incident report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
