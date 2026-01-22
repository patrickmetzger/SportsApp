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

    // Get current user's role
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("role, first_name, last_name, email")
      .eq("id", user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only parents can use this endpoint
    if (currentUser.role !== "parent") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { coach_id, subject, message } = body;

    // Validate required fields
    if (!coach_id || !subject || !message) {
      return NextResponse.json({ error: "Coach, subject, and message are required" }, { status: 400 });
    }

    // Verify the coach is associated with one of the parent's child's programs
    const { data: registrations } = await supabase
      .from('program_registrations')
      .select(`
        summer_programs (
          program_coaches (
            coach_id
          )
        )
      `)
      .eq('parent_user_id', user.id);

    const validCoachIds = new Set<string>();
    registrations?.forEach((reg: any) => {
      reg.summer_programs?.program_coaches?.forEach((pc: any) => {
        validCoachIds.add(pc.coach_id);
      });
    });

    if (!validCoachIds.has(coach_id)) {
      return NextResponse.json(
        { error: "You can only message coaches from your children's programs" },
        { status: 403 }
      );
    }

    // Get coach details
    const { data: coach } = await supabase
      .from("users")
      .select("email, first_name, last_name")
      .eq("id", coach_id)
      .single();

    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    // Create the communication record
    const { data: communication, error: createError } = await supabase
      .from("communications")
      .insert({
        sender_id: user.id,
        recipient_ids: [coach_id],
        recipient_type: "individual",
        subject,
        message,
        delivery_method: "email",
        status: "pending"
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating communication:", createError);
      return NextResponse.json({ error: "Failed to create communication" }, { status: 500 });
    }

    // Send email to coach
    let emailSent = false;
    try {
      if (coach.email) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: coach.email,
          subject: `Message from Parent: ${subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Message from ${currentUser.first_name} ${currentUser.last_name}</h2>
              <p style="color: #666; font-size: 14px;">A parent has sent you a message through SchoolSports.</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-weight: bold; color: #333;">Subject: ${subject}</p>
              <div style="margin: 20px 0; line-height: 1.6; color: #555; background: #f9f9f9; padding: 15px; border-radius: 8px;">
                ${message.replace(/\n/g, '<br>')}
              </div>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 12px; color: #999;">
                Reply to: ${currentUser.email}
              </p>
              <p style="font-size: 12px; color: #999;">
                This message was sent through the SchoolSports platform.
              </p>
            </div>
          `,
          replyTo: currentUser.email,
        });
        emailSent = true;
      }
    } catch (emailError: any) {
      console.error("Failed to send email:", emailError);
    }

    // Update communication status
    await supabase
      .from("communications")
      .update({
        status: emailSent ? 'sent' : 'failed',
        sent_at: emailSent ? new Date().toISOString() : null
      })
      .eq("id", communication.id);

    return NextResponse.json({
      success: true,
      message: emailSent ? "Message sent successfully" : "Message saved but email delivery failed",
      communication
    });
  } catch (error) {
    console.error("Error in parent send communication:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
