import { NextRequest, NextResponse } from 'next/server';
import { sendApprovalEmail } from '@/lib/email';
import { Resend } from 'resend';

/**
 * Debug endpoint to test email sending with detailed error information
 * Only available in development mode
 */
export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Debug endpoint is only available in development mode' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { studentEmail, studentName = 'Test Student' } = body;

    if (!studentEmail) {
      return NextResponse.json(
        { error: 'studentEmail is required' },
        { status: 400 }
      );
    }

    // Check configuration
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'PanAfrican Bitcoin Academy <onboarding@resend.dev>';
    
    const debugInfo: any = {
      apiKeyPresent: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPrefix: apiKey?.substring(0, 5) || 'N/A',
      fromEmail,
      toEmail: studentEmail,
      environment: process.env.NODE_ENV,
    };

    // Try to initialize Resend client
    let resendClient = null;
    try {
      if (apiKey) {
        resendClient = new Resend(apiKey);
        debugInfo.resendClientInitialized = true;
      } else {
        debugInfo.resendClientInitialized = false;
        debugInfo.error = 'No API key found';
      }
    } catch (initError: any) {
      debugInfo.resendClientInitialized = false;
      debugInfo.initError = initError.message;
    }

    // Try to send email
    let emailResult = null;
    if (resendClient) {
      try {
        emailResult = await sendApprovalEmail({
          studentName,
          studentEmail,
          cohortName: 'Test Cohort',
          needsPasswordSetup: true,
        });
        debugInfo.emailResult = emailResult;
      } catch (emailError: any) {
        debugInfo.emailError = {
          message: emailError.message,
          name: emailError.name,
          stack: emailError.stack,
        };
      }
    }

    // Try direct Resend API call for comparison
    let directResult = null;
    if (resendClient && apiKey) {
      try {
        const directResponse = await resendClient.emails.send({
          from: fromEmail,
          to: studentEmail,
          subject: 'Test Email from PanAfrican Bitcoin Academy',
          html: '<p>This is a test email.</p>',
          text: 'This is a test email.',
        });
        directResult = {
          success: true,
          emailId: directResponse.data?.id,
          error: directResponse.error,
        };
      } catch (directError: any) {
        directResult = {
          success: false,
          error: directError.message,
          errorDetails: directError,
        };
      }
    }

    return NextResponse.json({
      debug: debugInfo,
      emailResult,
      directResendTest: directResult,
      message: 'Check debug info above for details',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

// GET endpoint for configuration check
export async function GET() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'PanAfrican Bitcoin Academy <onboarding@resend.dev>';
  
  return NextResponse.json({
    apiKeyPresent: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    apiKeyPrefix: apiKey ? `${apiKey.substring(0, 5)}...` : 'N/A',
    fromEmail,
    environment: process.env.NODE_ENV,
    message: apiKey 
      ? 'API key is configured. Use POST to test email sending.'
      : 'API key is missing. Check your .env.local file.',
  });
}
