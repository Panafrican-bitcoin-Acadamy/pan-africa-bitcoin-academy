import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, attachRefresh } from '@/lib/adminSession';
import { Resend } from 'resend';
import { validateAndNormalizeEmail } from '@/lib/validation';

type RouteParams = {
  params: Promise<{ id: string }>;
};

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  try {
    return new Resend(apiKey);
  } catch (error: any) {
    console.error('Failed to initialize Resend client:', error.message);
    return null;
  }
};

const getFromEmail = () => {
  const envFromEmail = process.env.RESEND_FROM_EMAIL;
  if (!envFromEmail || envFromEmail.trim() === '' || !envFromEmail.includes('@')) {
    return 'PanAfrican Bitcoin Academy <noreply@panafricanbitcoin.com>';
  }
  return envFromEmail;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://panafricanbitcoin.com';

/**
 * Send event invitations to all students
 * POST /api/admin/events/[id]/send-invitations
 */
export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;

    // Fetch the event
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, name, type, start_time, end_time, description, link, recording_url, cohort_id')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError) {
      console.error('[Send Invitations] Error fetching event:', eventError);
      return NextResponse.json(
        { error: 'Failed to fetch event', details: eventError.message },
        { status: 500 }
      );
    }

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if Resend is configured
    const resend = getResendClient();
    if (!resend) {
      return NextResponse.json(
        { error: 'Email service not configured. Please set RESEND_API_KEY in environment variables.' },
        { status: 500 }
      );
    }

    // Fetch all students with their email addresses
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('students')
      .select(`
        id,
        profile_id,
        profiles (
          id,
          name,
          email
        )
      `);

    if (studentsError) {
      console.error('[Send Invitations] Error fetching students:', studentsError);
      return NextResponse.json(
        { error: 'Failed to fetch students', details: studentsError.message },
        { status: 500 }
      );
    }

    if (!students || students.length === 0) {
      return NextResponse.json(
        { error: 'No students found in the database' },
        { status: 404 }
      );
    }

    // Filter students with valid email addresses
    const validStudents = students
      .filter((student: any) => student.profiles && student.profiles.email)
      .map((student: any) => ({
        id: student.id,
        name: student.profiles.name || 'Student',
        email: student.profiles.email,
      }));

    if (validStudents.length === 0) {
      return NextResponse.json(
        { error: 'No students with valid email addresses found' },
        { status: 404 }
      );
    }

    // Format event date and time
    const formatDateTime = (dateString: string): string => {
      try {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short',
        });
      } catch {
        return dateString;
      }
    };

    const startTime = event.start_time ? formatDateTime(event.start_time) : 'TBA';
    const endTime = event.end_time ? formatDateTime(event.end_time) : null;

    // Prepare email content
    const emailSubject = `🎉 You're Invited: ${event.name}`;
    const fromEmail = getFromEmail();

    // Event type labels
    const eventTypeLabels: Record<string, string> = {
      'live-class': 'Live Class',
      'assignment': 'Assignment',
      'community': 'Community Event',
      'workshop': 'Workshop',
      'deadline': 'Deadline',
      'quiz': 'Quiz',
      'cohort': 'Cohort Event',
    };

    const eventTypeLabel = eventTypeLabels[event.type] || event.type || 'Event';

    // Send emails to all students
    let successCount = 0;
    let failureCount = 0;
    const failures: Array<{ email: string; error: string }> = [];

    for (const student of validStudents) {
      try {
        // Validate and normalize email
        const emailValidation = validateAndNormalizeEmail(student.email);
        if (!emailValidation.valid || !emailValidation.normalized) {
          failures.push({ email: student.email, error: 'Invalid email address' });
          failureCount++;
          continue;
        }

        const normalizedEmail = emailValidation.normalized;

        // Create personalized email HTML
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Event Invitation</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #f97316 0%, #06b6d4 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🎉 You're Invited!</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Hi ${student.name || 'Student'},
                </p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                  You're invited to join us for an upcoming event!
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #06b6d4;">
                  <h2 style="margin-top: 0; color: #1f2937; font-size: 20px; margin-bottom: 15px;">${event.name}</h2>
                  
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; font-weight: 600; color: #4b5563; width: 120px;">Type:</td>
                      <td style="padding: 8px 0; color: #1f2937;">${eventTypeLabel}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: 600; color: #4b5563;">Start Time:</td>
                      <td style="padding: 8px 0; color: #1f2937;">${startTime}</td>
                    </tr>
                    ${endTime ? `
                    <tr>
                      <td style="padding: 8px 0; font-weight: 600; color: #4b5563;">End Time:</td>
                      <td style="padding: 8px 0; color: #1f2937;">${endTime}</td>
                    </tr>
                    ` : ''}
                    ${event.description ? `
                    <tr>
                      <td style="padding: 8px 0; font-weight: 600; color: #4b5563; vertical-align: top;">Description:</td>
                      <td style="padding: 8px 0; color: #1f2937;">${event.description}</td>
                    </tr>
                    ` : ''}
                  </table>
                </div>
                
                ${event.link ? `
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${event.link}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #06b6d4 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Join Event
                  </a>
                </div>
                ` : ''}
                
                <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                  <p style="margin: 0; color: #1e40af; font-size: 14px;">
                    <strong>💡 Tip:</strong> Visit <a href="${SITE_URL}" style="color: #3b82f6;">${SITE_URL}</a> to view all upcoming events and manage your schedule.
                  </p>
                </div>
                
                <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  We look forward to seeing you there!
                </p>
                
                <p style="font-size: 14px; color: #6b7280; margin-top: 10px;">
                  Best regards,<br>
                  <strong>Pan-Africa Bitcoin Academy Team</strong>
                </p>
              </div>
            </body>
          </html>
        `;

        // Send email
        const { data: emailResult, error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: normalizedEmail,
          subject: emailSubject,
          html: emailHtml,
        });

        if (emailError) {
          console.error(`[Send Invitations] Error sending email to ${normalizedEmail}:`, emailError);
          failures.push({ email: student.email, error: emailError.message || 'Failed to send email' });
          failureCount++;
        } else {
          successCount++;
          console.log(`[Send Invitations] Email sent successfully to ${normalizedEmail}:`, emailResult?.id);
        }
      } catch (error: any) {
        console.error(`[Send Invitations] Exception sending email to ${student.email}:`, error);
        failures.push({ email: student.email, error: error.message || 'Unknown error' });
        failureCount++;
      }
    }

    console.log('[Send Invitations] Summary:', {
      eventId,
      eventName: event.name,
      totalStudents: validStudents.length,
      successCount,
      failureCount,
      adminId: session.adminId,
      adminEmail: session.email,
      timestamp: new Date().toISOString(),
    });

    const res = NextResponse.json(
      {
        success: true,
        message: `Invitations sent to ${successCount} student(s)`,
        totalStudents: validStudents.length,
        successCount,
        failureCount,
        failures: failures.length > 0 ? failures : undefined,
      },
      { status: 200 }
    );
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('[Send Invitations] Error in send invitations API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}

