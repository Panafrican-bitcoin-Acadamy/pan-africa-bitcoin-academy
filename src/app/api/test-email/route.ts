import { NextRequest, NextResponse } from 'next/server';
import { sendApprovalEmail } from '@/lib/email';

/**
 * Test endpoint for email sending functionality
 * This allows testing email sending without needing to approve an actual application
 * 
 * Usage:
 * POST /api/test-email
 * Body: {
 *   studentEmail: "test@example.com",
 *   studentName: "Test Student",
 *   cohortName: "Cohort 1" (optional),
 *   needsPasswordSetup: true
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Only allow in development mode for security
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Test endpoint is only available in development mode' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      studentEmail,
      studentName = 'Test Student',
      cohortName,
      needsPasswordSetup = true,
    } = body;

    if (!studentEmail) {
      return NextResponse.json(
        { error: 'studentEmail is required' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing email sending...', {
      studentEmail,
      studentName,
      cohortName,
      needsPasswordSetup,
    });

    // Test email sending
    const result = await sendApprovalEmail({
      studentName,
      studentEmail,
      cohortName,
      needsPasswordSetup,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully!',
        details: {
          to: studentEmail,
          from: process.env.RESEND_FROM_EMAIL || 'PanAfrican Bitcoin Academy <onboarding@resend.dev>',
          studentName,
          cohortName: cohortName || 'None',
          needsPasswordSetup,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send email',
          details: {
            to: studentEmail,
            studentName,
            cohortName: cohortName || 'None',
            needsPasswordSetup,
          },
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in test email endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check email configuration
export async function GET() {
  const hasApiKey = !!process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'PanAfrican Bitcoin Academy <onboarding@resend.dev>';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://panafricanbitcoin.com';

  return NextResponse.json({
    emailConfigured: hasApiKey,
    fromEmail,
    siteUrl,
    environment: process.env.NODE_ENV,
    message: hasApiKey
      ? '✅ Email service is configured. Use POST to send a test email.'
      : '⚠️ RESEND_API_KEY is not configured. Email sending will not work.',
  });
}
