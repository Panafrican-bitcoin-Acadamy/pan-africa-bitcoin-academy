import { NextRequest, NextResponse } from 'next/server';
import { sendApprovalEmail } from '@/lib/email';
import { requireAdmin } from '@/lib/adminSession';

/**
 * Test endpoint for email sending functionality
 * This allows testing email sending without needing to approve an actual application
 * Admin only endpoint - works in both development and production
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
    // Require admin authentication
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
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
export async function GET(req: NextRequest) {
  try {
    // Require admin authentication
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const hasApiKey = !!apiKey;
    const envFromEmail = process.env.RESEND_FROM_EMAIL;
    const fromEmail = envFromEmail && envFromEmail.trim() !== '' && envFromEmail.includes('@') 
      ? envFromEmail 
      : 'PanAfrican Bitcoin Academy <onboarding@resend.dev>';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://panafricanbitcoin.com';

    // Validate FROM_EMAIL format
    const fromEmailValid = fromEmail && fromEmail.includes('@');

    // Diagnostic information (only show in development for security)
    const diagnostics = process.env.NODE_ENV === 'development' ? {
      apiKeyPresent: hasApiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 3) + '...' : 'N/A',
      fromEmailEnv: envFromEmail || 'Not set (using default)',
      fromEmailValue: fromEmail,
      fromEmailValid: fromEmailValid,
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('RESEND')).join(', ') || 'None found',
    } : undefined;

    return NextResponse.json({
      emailConfigured: hasApiKey,
      fromEmail,
      siteUrl,
      environment: process.env.NODE_ENV,
      message: hasApiKey
        ? '✅ Email service is configured. Use POST to send a test email.'
        : '⚠️ RESEND_API_KEY is not configured. Email sending will not work.',
      ...(diagnostics && { diagnostics }),
    });
  } catch (error: any) {
    console.error('Error in test email GET endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}
