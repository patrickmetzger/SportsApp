import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      programId,
      programName,
      coachEmail,
      coachName,
      senderName,
      senderEmail,
      childId,
      message,
    } = body;

    // Validate required fields
    if (!programId || !senderName || !senderEmail || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(senderEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get child details if childId provided
    let childInfo = '';
    if (childId) {
      const { data: registration } = await supabase
        .from('program_registrations')
        .select('student_name, student_id')
        .eq('id', childId)
        .single();

      if (registration) {
        childInfo = `\nRegarding: ${registration.student_name} (${registration.student_id})`;
      }
    }

    // Format the message for email
    const emailBody = `
New contact form submission for ${programName}

From: ${senderName} (${senderEmail})${childInfo}

Message:
${message}

---
This message was sent through the ${programName} contact form.
    `.trim();

    // TODO: Send email to coach using an email service (SendGrid, Resend, etc.)
    // For now, we'll log it and return success
    console.log('Contact form submission:', {
      to: coachEmail,
      subject: `Contact Form: ${programName}`,
      body: emailBody,
    });

    // Optionally, save the message to a database table for tracking
    // await supabase.from('coach_messages').insert({...})

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully',
    });
  } catch (error: any) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
