import { Resend } from 'resend';
import { isValidEmail, validateAndNormalizeEmail } from './validation';

// Email configuration
// Default sender email (Resend's test domain)
const DEFAULT_FROM_EMAIL = 'Pan-African ₿itcoin Academy <noreply@panafricanbitcoin.com>';

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
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL || 'support@panafricanbitcoin.com';

function formatCohortDate(isoDate: string | undefined): string | undefined {
  if (!isoDate) return undefined;
  try {
    const d = new Date(isoDate + 'T12:00:00Z');
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return isoDate;
  }
}

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
  cohortStartDate?: string;
  cohortEndDate?: string;
  needsPasswordSetup: boolean;
  /** If provided, used as the set-password link (includes token for 72h expiry). Otherwise built from email only. */
  setupPasswordUrl?: string;
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
              This is an automated notification from the Pan-African ₿itcoin Academy platform.
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

function escapeHtmlForEmail(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface AssignmentSubmissionNotificationData {
  studentName: string;
  studentEmail: string;
  cohortName?: string;
  assignmentTitle: string;
  chapterNumber?: number | null;
  chapterSlug?: string | null;
  submissionId: string;
  /** True if student updated an existing submission (resubmit). */
  isResubmission: boolean;
  rewardSats?: number | null;
}

/**
 * Notify admin when a student submits an assignment that needs instructor review (same stack as withdrawal: Resend + ADMIN_EMAIL).
 */
export async function sendAssignmentSubmissionNotificationEmail(
  data: AssignmentSubmissionNotificationData
): Promise<{ success: boolean; error?: string; errorDetails?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY not configured. Assignment notification email will not be sent.');
      return { success: false, error: 'Email service not configured' };
    }

    const resend = getResendClient();
    if (!resend) {
      return { success: false, error: 'Email service not configured' };
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@panafricanbitcoin.com';
    if (!adminEmail || !adminEmail.includes('@')) {
      return {
        success: false,
        error: 'Admin email not configured',
        errorDetails: 'Please set ADMIN_EMAIL in environment variables',
      };
    }

    const adminEmailValidation = validateAndNormalizeEmail(adminEmail);
    if (!adminEmailValidation.valid || !adminEmailValidation.normalized) {
      return {
        success: false,
        error: 'Invalid admin email configuration',
        errorDetails: `Admin email "${adminEmail}" is not valid`,
      };
    }

    const normalizedAdminEmail = adminEmailValidation.normalized;
    const {
      studentName,
      studentEmail,
      cohortName,
      assignmentTitle,
      chapterNumber,
      chapterSlug,
      submissionId,
      isResubmission,
      rewardSats,
    } = data;

    const safeTitle = escapeHtmlForEmail(assignmentTitle);
    const adminUrl = `${SITE_URL.replace(/\/$/, '')}/admin`;

    const emailSubject = isResubmission
      ? `Resubmission: ${assignmentTitle} — ${studentName}`
      : `New assignment submission: ${assignmentTitle} — ${studentName}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Assignment submission</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #06b6d4 100%); padding: 24px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 22px;">📋 Assignment submission</h1>
          </div>
          <div style="background: #f9fafb; padding: 28px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 15px; margin-bottom: 18px;">
              A student has submitted work that <strong>needs instructor review</strong> in the admin panel.
            </p>
            <div style="background: white; padding: 18px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #f97316;">
              <h2 style="margin-top: 0; color: #1f2937; font-size: 17px;">Student</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #4b5563; width: 130px;">Name</td>
                  <td style="padding: 6px 0; color: #1f2937;">${escapeHtmlForEmail(studentName)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #4b5563;">Email</td>
                  <td style="padding: 6px 0; color: #1f2937;">${escapeHtmlForEmail(studentEmail)}</td>
                </tr>
                ${
                  cohortName
                    ? `<tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #4b5563;">Cohort</td>
                  <td style="padding: 6px 0; color: #1f2937;">${escapeHtmlForEmail(cohortName)}</td>
                </tr>`
                    : ''
                }
              </table>
            </div>
            <div style="background: white; padding: 18px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #06b6d4;">
              <h2 style="margin-top: 0; color: #1f2937; font-size: 17px;">Assignment</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #4b5563; width: 130px;">Title</td>
                  <td style="padding: 6px 0; color: #1f2937;">${safeTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #4b5563;">Chapter</td>
                  <td style="padding: 6px 0; color: #1f2937;">${chapterNumber != null ? String(chapterNumber) : '—'}${
      chapterSlug ? ` (${escapeHtmlForEmail(String(chapterSlug))})` : ''
    }</td>
                </tr>
                ${
                  rewardSats != null && rewardSats > 0
                    ? `<tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #4b5563;">Reward</td>
                  <td style="padding: 6px 0; color: #0891b2; font-weight: 600;">${Number(rewardSats)} sats</td>
                </tr>`
                    : ''
                }
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #4b5563;">Submission</td>
                  <td style="padding: 6px 0; color: #1f2937;">${isResubmission ? 'Resubmission (updated)' : 'New submission'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #4b5563;">Submission ID</td>
                  <td style="padding: 6px 0; color: #6b7280; font-size: 13px; word-break: break-all;">${escapeHtmlForEmail(submissionId)}</td>
                </tr>
              </table>
            </div>
            <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>Action:</strong> Open the admin dashboard → <strong>Assignment Submissions</strong> to review and grade.
              </p>
              <p style="margin: 10px 0 0 0;">
                <a href="${adminUrl}" style="color: #c2410c; font-weight: 600;">Open admin →</a>
              </p>
            </div>
            <p style="font-size: 13px; color: #6b7280; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              Automated notification from Pan-African ₿itcoin Academy.
            </p>
          </div>
        </body>
      </html>
    `;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: normalizedAdminEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    if (error) {
      console.error('❌ Error sending assignment submission notification:', error.message);
      return { success: false, error: error.message || 'Failed to send email' };
    }

    console.log('✅ Assignment submission notification sent to admin');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Exception in sendAssignmentSubmissionNotificationEmail:', message);
    return { success: false, error: message || 'Failed to send email' };
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

    const { studentName, studentEmail, cohortName, cohortStartDate, cohortEndDate, needsPasswordSetup, setupPasswordUrl: providedSetupUrl } = data;

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

    // Create email content — strong subject line
    const emailSubject = needsPasswordSetup
      ? `You’re In! Set Up Your Password – Pan-African ₿itcoin Academy`
      : `You’re In! Your Place at Pan-African ₿itcoin Academy is Confirmed`;

    const setupPasswordUrl = providedSetupUrl ?? `${SITE_URL}/setup-password?email=${encodeURIComponent(normalizedEmail)}`;

    const startLabel = formatCohortDate(cohortStartDate);
    const endLabel = formatCohortDate(cohortEndDate);
    const cohortTimelineHtml = (cohortName || startLabel || endLabel) ? `
                <div style="background: #e4e4e7; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px; border-left: 5px solid #ea580c;">
                  <p style="margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a;">Your cohort</p>
                  ${cohortName ? `<p style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #ea580c;">${cohortName}</p>` : ''}
                  ${(startLabel || endLabel) ? `<p style="margin: 0; font-size: 14px; color: #3f3f46;">${startLabel ? `Starts: ${startLabel}` : ''}${startLabel && endLabel ? ' · ' : ''}${endLabel ? `Ends: ${endLabel}` : ''}</p>` : ''}
                </div>
                ` : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Approved</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
              <div style="background: linear-gradient(135deg, #ea580c 0%, #0891b2 100%); padding: 32px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">You’re In – Welcome to Pan-African ₿itcoin Academy</h1>
              </div>
              <div style="background: #fafafa; padding: 32px 28px; border-radius: 0 0 12px 12px;">
                <p style="font-size: 16px; margin: 0 0 16px; color: #111827;">Dear ${studentName},</p>
                <p style="font-size: 16px; margin: 0 0 24px; color: #374151;">We are pleased to confirm that your application to <strong>Pan-African ₿itcoin Academy</strong> has been <strong>accepted</strong>. You now have a place in our programme.</p>
                ${cohortTimelineHtml}
                <h2 style="font-size: 17px; font-weight: 700; color: #18181b; margin: 0 0 12px;">Complete your registration – set your password</h2>
                <p style="font-size: 15px; margin: 0 0 20px; color: #374151;">To access your dashboard and join your cohort, set up your account password using the link below. This is the only step left before you can start learning.</p>
                <div style="text-align: center; margin: 24px 0;">
                  <a href="${setupPasswordUrl}" style="display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #0891b2 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 8px rgba(234, 88, 12, 0.25);">Set up your password</a>
                </div>
                <p style="font-size: 13px; margin: 0 0 8px; color: #71717a;">Or copy and paste into your browser: <a href="${setupPasswordUrl}" style="color: #0891b2; word-break: break-all;">${setupPasswordUrl}</a></p>
                <p style="font-size: 12px; margin: 0 0 24px; color: #71717a;">This link expires in 72 hours.</p>
                <div style="background: #f4f4f5; padding: 20px 22px; border-radius: 10px; margin-bottom: 20px; border-left: 5px solid #0891b2;">
                  <h3 style="margin: 0 0 10px; color: #18181b; font-size: 16px;">What's next?</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #3f3f46; font-size: 14px;">
                    <li style="margin-bottom: 6px;">Start earning sats as you progress</li>
                    <li style="margin-bottom: 6px;">Complete assignments and chapters</li>
                    <li style="margin-bottom: 6px;">Join live sessions and your cohort community</li>
                    <li style="margin-bottom: 0;">Build your Bitcoin knowledge step by step</li>
                  </ul>
                </div>
                <p style="font-size: 14px; margin: 0 0 16px; color: #374151;"><strong>Security reminder:</strong> Never share your password, recovery phrases, or private keys with anyone. The Academy will never ask for them by email or message.</p>
                <p style="font-size: 14px; margin: 0 0 20px; color: #374151;">Pan-African ₿itcoin Academy exists to empower learners across the continent with sound Bitcoin education, in a supportive cohort-based community.</p>
                <p style="font-size: 14px; margin: 0 0 4px; color: #111827;">Best regards,</p>
                <p style="font-size: 14px; margin: 0 0 2px; color: #374151;"><strong>Pan-African ₿itcoin Academy</strong></p>
                <p style="font-size: 13px; margin: 0; color: #71717a;">Support: <a href="mailto:${SUPPORT_EMAIL}" style="color: #0891b2;">${SUPPORT_EMAIL}</a></p>
              </div>
            </div>
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

/**
 * Data for the "disregard first email" password-setup follow-up
 */
interface PasswordSetupFollowUpEmailData {
  studentName: string;
  studentEmail: string;
  cohortName?: string;
  cohortStartDate?: string;
  cohortEndDate?: string;
  /** If provided, used as the set-password link (includes token for 72h expiry). Otherwise built from email only. */
  setupPasswordUrl?: string;
}

/**
 * Send follow-up email asking students to disregard the first email and use this link to set up their password.
 * Styled like the dark-theme approval email (Congratulations header, cohort, Set Up Your Password button, What's Next).
 */
export async function sendPasswordSetupFollowUpEmail(data: PasswordSetupFollowUpEmailData): Promise<{ success: boolean; error?: string; errorDetails?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY not configured.');
      return { success: false, error: 'Email service not configured' };
    }

    const resend = getResendClient();
    if (!resend) {
      return { success: false, error: 'Email service not configured' };
    }

    const { studentName, studentEmail, cohortName, cohortStartDate, cohortEndDate, setupPasswordUrl: providedSetupUrl } = data;

    const emailValidation = validateAndNormalizeEmail(studentEmail);
    if (!emailValidation.valid || !emailValidation.normalized) {
      return {
        success: false,
        error: 'Invalid email address',
        errorDetails: `Student email "${studentEmail}" is not valid`,
      };
    }

    const normalizedEmail = emailValidation.normalized;
    const setupPasswordLink = providedSetupUrl ?? `${SITE_URL}/setup-password?email=${encodeURIComponent(normalizedEmail)}`;

    const emailSubject = 'ዘድሊ ስጉምቲ፡ ፓስዎርድኻ ቀይር – Pan-African ₿itcoin Academy';

    const startLabel = formatCohortDate(cohortStartDate);
    const endLabel = formatCohortDate(cohortEndDate);
    const cohortTimelineHtml = (cohortName || startLabel || endLabel) ? `
              <div style="background: #262626; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px; border-left: 5px solid #f97316;">
                <p style="margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #a3a3a3;">Your cohort</p>
                ${cohortName ? `<p style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #f97316;">${cohortName}</p>` : ''}
                ${(startLabel || endLabel) ? `<p style="margin: 0; font-size: 14px; color: #d4d4d4;">${startLabel ? `Starts: ${startLabel}` : ''}${startLabel && endLabel ? ' · ' : ''}${endLabel ? `Ends: ${endLabel}` : ''}</p>` : ''}
              </div>
              ` : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ፓስዎርድኻ ቀይር</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #0a0a0a;">
          <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: linear-gradient(135deg, #ea580c 0%, #0891b2 100%); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">ፓስዎርድኻ ቀይር – Pan-African ₿itcoin Academy</h1>
            </div>
            <div style="background: #171717; padding: 32px 28px; border-radius: 0 0 12px 12px; border: 1px solid #262626; border-top: none;">
              <p style="font-size: 16px; margin: 0 0 16px; color: #fff;">ዝኸበርካ ${studentName} ፡</p>
              <p style="font-size: 16px; margin: 0 0 16px; color: #d4d4d4;">ነዚ ኢመይል ጥራይ ተጠቐሙ፡ ዝኾነ ኣቐዲሙ ዝነበረ ሊንክ ድማ ግደፍዎ ። ናብ <strong>ፓን-ኣፍሪካን ₿itcoin ኣካዳሚ</strong> ዝገበርካዮ መመልከታ <strong>ተቐባልነት ረኺቡ ኣሎ</strong> ፣ ኣብ መደብ ትምህርትና ድማ ቦታ ሒዝካ/ኪ ኣለካ።</p>
              ${cohortTimelineHtml}
              <h2 style="font-size: 17px; font-weight: 700; color: #fff; margin: 0 0 12px;">ምዝገባኻ ኣጠናቕቕ – ፓስዎርድካ ኣቐምጥ</h2>
              <p style="font-size: 15px; margin: 0 0 20px; color: #d4d4d4;">ናይ ኣካውንትካ ፓስዎርድ ንምቕማጥ ኣብ ታሕቲ ዘሎ ባትን ጠውቕ። ዳሽቦርድካ ንምጥቃምን ናይ ኮሆርት ማሕበረሰብ ንምጽንባርን ዝተረፈ እዚ ስጉምቲ እዚ እዩ።</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${setupPasswordLink}" style="display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #0891b2 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px;">ፓስዎርድካ ኣቐምጥ</a>
              </div>
              <p style="font-size: 13px; margin: 0 0 8px; color: #a3a3a3;">ወይ ድማ ነዚ ሊንክ ኮፒ ኢልካ ኣብ ብራውዘርካ ፔስት በሎ: <a href="${setupPasswordLink}" style="color: #38bdf8; word-break: break-all;">${setupPasswordLink}</a></p>
              <p style="font-size: 12px; margin: 0 0 24px; color: #a3a3a3;">እዚ ሊንክ ድሕሪ 72 ሰዓት ክውዳእ እዩ።</p>
              <div style="background: #262626; padding: 20px 22px; border-radius: 10px; margin-bottom: 20px; border-left: 5px solid #06b6d4;">
                <h3 style="margin: 0 0 10px; color: #fff; font-size: 16px;">ቅጺሉ እንታይ አሎ?</h3>
                <ul style="margin: 0; padding-left: 20px; color: #d4d4d4; font-size: 14px;">
                  <li style="margin-bottom: 6px;">ናይ ኮሆርት ማሕበረሰብን ቀጥታ ትምህርትታትን ተጸንበር</li>
                  <li style="margin-bottom: 6px;">ዕማማትን ምዕራፋትን ኣጠናቕቕ</li>
                  <li style="margin-bottom: 6px;">ክትምሃር ከለኻ ሳትስ ምእካብ ጀምር</li>
                  <li style="margin-bottom: 0;">ናይ ቢትኮይን ፍልጠትካ ስጉምቲ ብስጉምቲ ሃንጽ</li>
                </ul>
              </div>
              <p style="font-size: 14px; margin: 0 0 16px; color: #d4d4d4;"><strong style="color: #fff;">ናይ ድሕነት ኣስተውዕሎ:</strong> ፓስዎርድካ፡ ናይ ምሕዳስ ቃላትካ፡ ወይ ናይ ብሕቲ መፍትሕካ ንዝኾነ ሰብ ኣይትሃቦ። ኣካዳሚ ብኢመይል ወይ መልእኽቲ ከምኡ ኣይሓትትን።</p>
              <p style="font-size: 14px; margin: 0 0 20px; color: #d4d4d4;">Pan-African ₿itcoin Academy ኣብ ኣፍሪቃ ዘለዉ ተማሃሮ ብዝተወደበ ናይ ኮሆርት ማሕበረሰብ ጥዑይ ናይ ቢትኮይን ትምህርቲ ንምሃብ ዝተመስረተ እዩ።</p>
              <p style="font-size: 14px; margin: 0 0 4px; color: #fff;">ምስ ሰናይ ትምኒት፡</p>
              <p style="font-size: 14px; margin: 0 0 2px; color: #d4d4d4;"><strong>Pan-African ₿itcoin Academy</strong></p>
              <p style="font-size: 13px; margin: 0; color: #a3a3a3;">ሓገዝ: <a href="mailto:${SUPPORT_EMAIL}" style="color: #38bdf8;">${SUPPORT_EMAIL}</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log('📧 Sending password setup follow-up email to:', normalizedEmail);

    const { data: emailResponse, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: normalizedEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    if (error) {
      console.error('❌ Error sending password setup follow-up email:', { error: error.message, studentEmail: normalizedEmail });
      return { success: false, error: error.message || 'Failed to send email' };
    }

    console.log('✅ Password setup follow-up email sent:', { emailId: emailResponse?.id, to: normalizedEmail });
    return { success: true };
  } catch (error: any) {
    console.error('❌ Exception in sendPasswordSetupFollowUpEmail:', error?.message);
    return { success: false, error: error?.message || 'Failed to send password setup follow-up email' };
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
    const emailSubject = 'Application Status - Pan-African ₿itcoin Academy';
    
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
              Thank you for your interest in the Pan-African ₿itcoin Academy. After careful review, we regret to inform you that we are unable to approve your application at this time.
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

interface VerificationEmailData {
  userName: string;
  userEmail: string;
  verificationToken: string;
}

interface PasswordResetEmailData {
  userName: string;
  userEmail: string;
  resetLink: string;
  /**
   * When true, this is a follow-up reminder (for example,
   * an admin sending a second password setup link to a
   * student who hasn’t set their password yet).
   */
  isReminder?: boolean;
}

/**
 * Send email verification email to new user
 */
export async function sendVerificationEmail(data: VerificationEmailData): Promise<{ success: boolean; error?: string; errorDetails?: string }> {
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

    const { userName, userEmail, verificationToken } = data;

    // Validate email
    const emailValidation = validateAndNormalizeEmail(userEmail);
    if (!emailValidation.valid || !emailValidation.normalized) {
      console.error('❌ Invalid user email:', userEmail);
      return {
        success: false,
        error: 'Invalid email address',
        errorDetails: `User email "${userEmail}" is not valid`,
      };
    }

    const normalizedEmail = emailValidation.normalized;

    // Create verification link
    const verificationLink = `${SITE_URL}/verify-email?token=${encodeURIComponent(verificationToken)}&email=${encodeURIComponent(normalizedEmail)}`;

    // Create email content
    const emailSubject = 'Verify Your Email - Pan-African ₿itcoin Academy';
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #06b6d4 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✉️ Verify Your Email Address</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hi ${userName},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for registering with Pan-African ₿itcoin Academy! To complete your registration and verify your identity, please confirm your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #06b6d4 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="font-size: 12px; color: #9ca3af; word-break: break-all; background: white; padding: 10px; border-radius: 4px; border: 1px solid #e5e7eb;">
              ${verificationLink}
            </p>
            
            <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin-top: 20px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⚠️ Important:</strong> This verification link will expire in 72 hours. If you didn't create an account with us, please ignore this email.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              If the button doesn't work, you can also verify by visiting our website and entering the verification code when prompted.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    console.log('📧 Sending verification email:', {
      to: normalizedEmail,
      userName,
    });

    const { data: emailResponse, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: normalizedEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    if (error) {
      console.error('❌ Error sending verification email:', {
        error: error.message,
        userEmail: normalizedEmail,
      });
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    console.log('✅ Verification email sent successfully:', {
      emailId: emailResponse?.id,
      to: normalizedEmail,
    });

    return { success: true };
  } catch (error: any) {
    console.error('❌ Exception in sendVerificationEmail:', {
      error: error.message,
      stack: error.stack,
    });
    return {
      success: false,
      error: error.message || 'Failed to send verification email',
    };
  }
}

/**
 * Send password reset email to user
 */
export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<{ success: boolean; error?: string; errorDetails?: string }> {
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

    const { userName, userEmail, resetLink, isReminder } = data;

    // Validate email
    const emailValidation = validateAndNormalizeEmail(userEmail);
    if (!emailValidation.valid || !emailValidation.normalized) {
      console.error('❌ Invalid user email:', userEmail);
      return {
        success: false,
        error: 'Invalid email address',
        errorDetails: `User email "${userEmail}" is not valid`,
      };
    }

    const normalizedEmail = emailValidation.normalized;

    // Create email content
    const emailSubject = isReminder
      ? 'Important: Set Up Your Password - Pan-African ₿itcoin Academy'
      : 'ፓስዎርድካ ዳግማይ ቀይሮ - Pan-African ₿itcoin Academy';

    const introText = isReminder
      ? 'This is the second time we are sending you a password setup link for your Pan-African ₿itcoin Academy account. Please follow the steps carefully now to create your password and secure your access.'
      : 'ናይ ፓን-ኣፍሪቃ ቢትኮይን ኣካዳሚ ኣካውንት ፓስዎርድካ ዳግማይ ክትቅይሮ ሕቶ መጺኡና። ሓድሽ ፓስዎርድ ንምፍጣር ኣብ ታሕቲ ዘሎ ልንክ ጠውቑ።';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ፓስዎርድካ ዳግማይ ቀይሮ</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #06b6d4 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🔐 ፓስዎርድካ ዳግማይ ቀይር</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              ሰላም ${userName},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              ${introText} 
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #06b6d4 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                ፓስዎርድካ ቀይር
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              ወይ ድማ ነዚ ሊንክ ኮፒ ኢልካ ኣብ ችህሮመ ውይ ሞዚላ ፔስት በሎ።
            </p>
            <p style="font-size: 12px; color: #9ca3af; word-break: break-all; background: white; padding: 10px; border-radius: 4px; border: 1px solid #e5e7eb;">
              ${resetLink}
            </p>
            
            <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin-top: 20px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⚠️ Important:</strong> እዚ ሪሰት ሊንክ ድሕሪ 24 ሰዓት ብጸጥታ ምኽንያት ክውዳእ እዩ። ፓስዎርድ ዳግመ ምትዕርራይ እንተዘይሓቲትኩም፡ ነዚ ኢመይል ኣይትገደስሉ፡ ፓስዎርድኩም ድማ ከይተቐየረ ክተርፍ እዩ።
              </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              ዝኾነ ጸገም ተጋጢምኩም ኣብ ዋትሳኣፕ ግሩፕ ርኸቡና።
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    console.log('📧 Sending password reset email:', {
      to: normalizedEmail,
      userName,
    });

    const { data: emailResponse, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: normalizedEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    if (error) {
      console.error('❌ Error sending password reset email:', {
        error: error.message,
        userEmail: normalizedEmail,
      });
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    console.log('✅ Password reset email sent successfully:', {
      emailId: emailResponse?.id,
      to: normalizedEmail,
    });

    return { success: true };
  } catch (error: any) {
    console.error('❌ Exception in sendPasswordResetEmail:', {
      error: error.message,
      stack: error.stack,
    });
    return {
      success: false,
      error: error.message || 'Failed to send password reset email',
    };
  }
}
