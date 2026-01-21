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

    // Get current user's role and school
    const { data: currentUserData, error: userError } = await supabase
      .from("users")
      .select("role, school_id")
      .eq("id", user.id)
      .single();

    if (userError || !currentUserData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // At this point, currentUserData is guaranteed to be non-null
    const userData = currentUserData;

    // Only admins and school_admins can send communications
    if (userData.role !== "admin" && userData.role !== "school_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { recipient_ids, recipient_type, school_id, subject, message, delivery_method } = body;

    // Validate required fields
    if (!recipient_ids || !Array.isArray(recipient_ids) || recipient_ids.length === 0) {
      return NextResponse.json({ error: "At least one recipient is required" }, { status: 400 });
    }

    if (
      !recipient_type ||
      !["individual", "school_coaches", "school_parents", "all_coaches"].includes(recipient_type)
    ) {
      return NextResponse.json({ error: "Invalid recipient type" }, { status: 400 });
    }

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    if (!delivery_method || !["email", "sms", "both"].includes(delivery_method)) {
      return NextResponse.json({ error: "Invalid delivery method" }, { status: 400 });
    }

    // School admins can only send to coaches and parents at their school
    if (userData.role === "school_admin") {
      // Verify all recipients are coaches or parents at the school admin's school
      const { data: recipients, error: recipientsError } = await supabase
        .from("users")
        .select("id, school_id, role")
        .in("id", recipient_ids);

      if (recipientsError) {
        return NextResponse.json({ error: "Failed to verify recipients" }, { status: 500 });
      }

      const invalidRecipients = recipients?.filter(
        (r) => !["coach", "parent"].includes(r.role) || r.school_id !== userData.school_id
      );

      if (invalidRecipients && invalidRecipients.length > 0) {
        return NextResponse.json(
          {
            error:
              "School admins can only send communications to coaches and parents at their school"
          },
          { status: 403 }
        );
      }
    }

    // School admins cannot send to all_coaches
    if (userData.role === "school_admin" && recipient_type === "all_coaches") {
      return NextResponse.json(
        { error: "School admins cannot send to all coaches" },
        { status: 403 }
      );
    }

    // For school admins, always use their school_id
    const finalSchoolId = userData.role === 'school_admin'
      ? userData.school_id
      : (school_id || null);

    console.log('Final school_id for communication:', finalSchoolId);

    // Create the communication record
    const { data: communication, error: createError } = await supabase
      .from("communications")
      .insert({
        sender_id: user.id,
        recipient_ids,
        recipient_type,
        school_id: finalSchoolId,
        subject,
        message,
        delivery_method,
        status: "pending"
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating communication:", createError);
      return NextResponse.json({ error: "Failed to create communication" }, { status: 500 });
    }

    // Send emails if delivery method includes email
    let emailsSent = 0;
    let emailErrors: string[] = [];

    if (delivery_method === 'email' || delivery_method === 'both') {
      // Get recipient emails
      const { data: recipientUsers } = await supabase
        .from('users')
        .select('email, first_name, last_name')
        .in('id', recipient_ids);

      if (recipientUsers && recipientUsers.length > 0) {
        // Send email to each recipient
        for (const recipient of recipientUsers) {
          if (!recipient.email) continue;

          try {
            const result = await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
              to: recipient.email,
              subject: subject,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333;">Hello ${recipient.first_name || ''}${recipient.last_name ? ' ' + recipient.last_name : ''},</h2>
                  <div style="margin: 20px 0; line-height: 1.6; color: #555;">
                    ${message.replace(/\n/g, '<br>')}
                  </div>
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                  <p style="font-size: 12px; color: #999;">
                    This is an automated message from your school athletics program.
                  </p>
                </div>
              `,
            });
            console.log(`Email sent to ${recipient.email}:`, result);
            emailsSent++;
          } catch (error: any) {
            console.error(`Failed to send email to ${recipient.email}:`, error);
            emailErrors.push(`${recipient.email}: ${error.message}`);
          }
        }
      }
    }

    // Update communication status
    const status = emailErrors.length === 0 ? 'sent' : 'partial';
    const { error: updateError } = await supabase
      .from("communications")
      .update({
        status: status,
        sent_at: new Date().toISOString()
      })
      .eq("id", communication.id);

    if (updateError) {
      console.error("Error updating communication status:", updateError);
    }

    // Log for debugging
    console.log("Communication sent:", {
      id: communication.id,
      recipient_count: recipient_ids.length,
      emails_sent: emailsSent,
      email_errors: emailErrors.length,
      delivery_method,
      recipient_type
    });

    return NextResponse.json({
      success: true,
      communication,
      message: `Communication sent successfully. ${emailsSent} email(s) sent.${emailErrors.length > 0 ? ` ${emailErrors.length} failed.` : ''}`,
      emailsSent,
      emailErrors: emailErrors.length > 0 ? emailErrors : undefined
    });
  } catch (error) {
    console.error("Error in send communication:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
