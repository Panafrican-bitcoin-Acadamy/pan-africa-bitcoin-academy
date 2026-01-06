import { Resend } from 'resend';
import { isValidEmail, validateAndNormalizeEmail } from './validation';

// Email configuration
// Default sender email (Resend's test domain)
const DEFAULT_FROM_EMAIL = 'PanAfrican Bitcoin Academy <noreply@panafricanbitcoin.com>';

// Get FROM_EMAIL from env, but validate it
const getFromEmail = () => {
  const envFromEmail = process.env.RESEND_FROM_EMAIL;
  // If env var is set but empty or invalid, use default
  if (!envFromEmail || envFromEmail.trim() === '' || !envFromEmail.includes('@')) {
    console.warn('⚠️ RESEND_FROM_EMAIL is not set or invalid. Using default:', DEFAULT_FROM_EMAIL);
    return DEFAULT_FROM_EMAIL;
  }
  return envFromEmail;
};

const FROM_EMAIL = getFromEmail();
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://panafricanbitcoin.com';

// Initialize Resend client only if API key is available
// Use a placeholder during build time to avoid errors
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('❌ RESEND_API_KEY is not set in environment variables');
    return null;
  }
  if (apiKey.trim() === '') {
    console.error('❌ RESEND_API_KEY is empty');
    return null;
  }
  if (!apiKey.startsWith('re_')) {
    console.warn('⚠️ RESEND_API_KEY does not start with "re_" - may be invalid');
  }
  try {
    return new Resend(apiKey);
  } catch (error: any) {
    console.error('❌ Failed to initialize Resend client:', error.message);
    return null;
  }
};

interface ApprovalEmailData {
  studentName: string;
  studentEmail: string;
  cohortName?: string;
  needsPasswordSetup: boolean;
}

interface WithdrawalRequestData {
  studentName: string;
  studentEmail: string;
  studentId?: string;
  satsEarned: number;
  satsPending: number;
  cohortName?: string;
}

/**
 * Send withdrawal request notification email to admin
 */
export async function sendWithdrawalRequestEmail(data: WithdrawalRequestData): Promise<{ success: boolean; error?: string; errorDetails?: string }> {
  try {
    // Check if Resend API key is configured
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY not configured. Email will not be sent.');
      if (process.env.NODE_ENV === 'development') {
        console.error('Please set RESEND_API_KEY in your environment variables (.env.local for local development)');
      }
      return { success: false, error: 'Email service not configured' };
    }
    
    const resend = getResendClient();
    if (!resend) {
      console.error('❌ Failed to initialize Resend client even though API key exists.');
      return { success: false, error: 'Email service not configured' };
    }

    const { studentName, studentEmail, studentId, satsEarned, satsPending, cohortName } = data;

    // Get admin email from environment variable, or use the default admin email
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@panafricanbitcoin.com';
    
    if (!adminEmail || !adminEmail.includes('@')) {
      console.error('❌ ADMIN_EMAIL not configured. Email will not be sent.');
      return { 
        success: false, 
        error: 'Admin email not configured',
        errorDetails: 'Please set ADMIN_EMAIL in environment variables'
      };
    }

    // Validate admin email
    const adminEmailValidation = validateAndNormalizeEmail(adminEmail);
    if (!adminEmailValidation.valid || !adminEmailValidation.normalized) {
      console.error('❌ Invalid admin email:', adminEmail);
      return { 
        success: false, 
        error: 'Invalid admin email configuration',
        errorDetails: `Admin email "${adminEmail}" is not valid`
      };
    }

    const normalizedAdminEmail = adminEmailValidation.normalized;

    // Create email content
    const emailSubject = `Withdrawal Request - ${studentName} (${studentEmail})`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Withdrawal Request</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #06b6d4 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⚡ Sats Withdrawal Request</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              A student has requested to withdraw their sats via LNURL.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f97316;">
              <h2 style="margin-top: 0; color: #1f2937; font-size: 18px;">Student Information</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #4b5563; width: 140px;">Name:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${studentName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #4b5563;">Email:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${studentEmail}</td>
                </tr>
                ${studentId ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #4b5563;">Student ID:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${studentId}</td>
                </tr>
                ` : ''}
                ${cohortName ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #4b5563;">Cohort:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${cohortName}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #06b6d4;">
              <h2 style="margin-top: 0; color: #1f2937; font-size: 18px;">Sats Balance</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #4b5563; width: 140px;">Total Earned:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 18px; font-weight: 600;">${satsEarned.toLocaleString()} sats</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #4b5563;">Pending:</td>
                  <td style="padding: 8px 0; color: #f59e0b; font-size: 18px; font-weight: 600;">${satsPending.toLocaleString()} sats</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⚠️ Action Required:</strong> Please process the withdrawal request and send sats to the student via Lightning Network (LNURL).
              </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              This is an automated notification from the Pan-Africa Bitcoin Academy platform.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    console.log('📧 Sending withdrawal request email:', {
      to: normalizedAdminEmail,
      studentName,
      studentEmail,
    });

    const { data: emailResponse, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: normalizedAdminEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    if (error) {
      console.error('❌ Error sending withdrawal request email:', {
        error: error.message,
        studentEmail,
      });
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    console.log('✅ Withdrawal request email sent successfully:', {
      emailId: emailResponse?.id,
      to: normalizedAdminEmail,
    });

    return { success: true };
  } catch (error: any) {
    console.error('❌ Exception in sendWithdrawalRequestEmail:', {
      error: error.message,
      stack: error.stack,
    });
    return {
      success: false,
      error: error.message || 'Failed to send withdrawal request email',
    };
  }
}

/**
 * Send approval email to student when their application is approved
 */
export async function sendApprovalEmail(data: ApprovalEmailData): Promise<{ success: boolean; error?: string; errorDetails?: string }> {
  try {
    // Check if Resend API key is configured
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY not configured. Email will not be sent.');
      if (process.env.NODE_ENV === 'development') {
        console.error('Please set RESEND_API_KEY in your environment variables (.env.local for local development)');
      }
      return { success: false, error: 'Email service not configured' };
    }
    
    const resend = getResendClient();
    if (!resend) {
      console.error('❌ Failed to initialize Resend client even though API key exists.');
      return { success: false, error: 'Email service not configured' };
    }

    const { studentName, studentEmail, cohortName, needsPasswordSetup } = data;

    // Validate email
    const emailValidation = validateAndNormalizeEmail(studentEmail);
    if (!emailValidation.valid || !emailValidation.normalized) {
      console.error('❌ Invalid student email:', studentEmail);
      return {
        success: false,
        error: 'Invalid email address',
        errorDetails: `Student email "${studentEmail}" is not valid`,
      };
    }

    const normalizedEmail = emailValidation.normalized;

    // Create email content
    const emailSubject = needsPasswordSetup
      ? `Welcome to Pan-Africa Bitcoin Academy - Set Up Your Password`
      : `Welcome to Pan-Africa Bitcoin Academy - Your Application is Approved!`;

    const passwordSetupSection = needsPasswordSetup
      ? `
        <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; color: #1e40af; font-size: 14px;">
            <strong>🔐 Action Required:</strong> You need to set up your password to access your account. Use the password reset link below.
          </p>
        </div>
      `
      : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Approved</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #06b6d4 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Welcome to Pan-Africa Bitcoin Academy!</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hi ${studentName},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Great news! Your application to the Pan-Africa Bitcoin Academy has been approved! 🎊
            </p>
            
            ${passwordSetupSection}
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #06b6d4;">
              <h2 style="margin-top: 0; color: #1f2937; font-size: 18px;">What's Next?</h2>
              <ul style="color: #1f2937; padding-left: 20px;">
                <li>Start earning sats as you progress</li>
                <li>Complete assignments and chapters</li>
                <li>Join live sessions and community discussions</li>
                <li>Build your Bitcoin knowledge step by step</li>
              </ul>
            </div>
            
            ${cohortName ? `
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f97316;">
              <p style="margin: 0; color: #1f2937;">
                <strong>Cohort:</strong> ${cohortName}
              </p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${SITE_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #06b6d4 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Access Your Dashboard
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              We're excited to have you join us on this Bitcoin journey!
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    console.log('📧 Sending approval email:', {
      to: normalizedEmail,
      studentName,
      needsPasswordSetup,
    });

    const { data: emailResponse, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: normalizedEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    if (error) {
      console.error('❌ Error sending approval email:', {
        error: error.message,
        studentEmail: normalizedEmail,
      });
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    console.log('✅ Approval email sent successfully:', {
      emailId: emailResponse?.id,
      to: normalizedEmail,
    });

    return { success: true };
  } catch (error: any) {
    console.error('❌ Exception in sendApprovalEmail:', {
      error: error.message,
      stack: error.stack,
    });
    return {
      success: false,
      error: error.message || 'Failed to send approval email',
    };
  }
}

interface RejectionEmailData {
  studentName: string;
  studentEmail: string;
  rejectionReason?: string;
}

/**
 * Send rejection email to student when their application is rejected
 */
export async function sendRejectionEmail(data: RejectionEmailData): Promise<{ success: boolean; error?: string; errorDetails?: string }> {
  try {
    // Check if Resend API key is configured
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY not configured. Email will not be sent.');
      if (process.env.NODE_ENV === 'development') {
        console.error('Please set RESEND_API_KEY in your environment variables (.env.local for local development)');
      }
      return { success: false, error: 'Email service not configured' };
    }
    
    const resend = getResendClient();
    if (!resend) {
      console.error('❌ Failed to initialize Resend client even though API key exists.');
      return { success: false, error: 'Email service not configured' };
    }

    const { studentName, studentEmail, rejectionReason } = data;

    // Validate email
    const emailValidation = validateAndNormalizeEmail(studentEmail);
    if (!emailValidation.valid || !emailValidation.normalized) {
      console.error('❌ Invalid student email:', studentEmail);
      return {
        success: false,
        error: 'Invalid email address',
        errorDetails: `Student email "${studentEmail}" is not valid`,
      };
    }

    const normalizedEmail = emailValidation.normalized;

    // Create email content
    const emailSubject = 'Application Status - Pan-Africa Bitcoin Academy';
    
    const rejectionReasonSection = rejectionReason
      ? `
        <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Reason:</strong> ${rejectionReason}
          </p>
        </div>
      `
      : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Status</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #06b6d4 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Application Status Update</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hi ${studentName},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for your interest in the Pan-Africa Bitcoin Academy. After careful review, we regret to inform you that we are unable to approve your application at this time.
            </p>
            
            ${rejectionReasonSection}
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              We encourage you to continue learning about Bitcoin and consider applying again in the future.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    console.log('📧 Sending rejection email:', {
      to: normalizedEmail,
      studentName,
    });

    const { data: emailResponse, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: normalizedEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    if (error) {
      console.error('❌ Error sending rejection email:', {
        error: error.message,
        studentEmail: normalizedEmail,
      });
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    console.log('✅ Rejection email sent successfully:', {
      emailId: emailResponse?.id,
      to: normalizedEmail,
    });

    return { success: true };
  } catch (error: any) {
    console.error('❌ Exception in sendRejectionEmail:', {
      error: error.message,
      stack: error.stack,
    });
    return {
      success: false,
      error: error.message || 'Failed to send rejection email',
    };
  }
}
