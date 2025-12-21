import { Resend } from 'resend';
import { isValidEmail, validateAndNormalizeEmail } from './validation';

// Email configuration
// Default sender email (Resend's test domain)
const DEFAULT_FROM_EMAIL = 'PanAfrican Bitcoin Academy <onboarding@resend.dev>';

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
    return null;
  }
  return new Resend(apiKey);
};

interface ApprovalEmailData {
  studentName: string;
  studentEmail: string;
  cohortName?: string;
  needsPasswordSetup: boolean;
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
      console.error('Please set RESEND_API_KEY in your environment variables (.env.local for local development)');
      return { success: false, error: 'Email service not configured' };
    }
    
    const resend = getResendClient();
    if (!resend) {
      console.error('❌ Failed to initialize Resend client even though API key exists.');
      return { success: false, error: 'Email service not configured' };
    }

    const { studentName, studentEmail, cohortName, needsPasswordSetup } = data;

    // Validate and normalize email address
    const emailValidation = validateAndNormalizeEmail(studentEmail);
    if (!emailValidation.valid || !emailValidation.normalized) {
      const errorMsg = emailValidation.error || 'Invalid email address';
      console.error('Invalid student email:', studentEmail, errorMsg);
      return { success: false, error: errorMsg };
    }

    const normalizedEmail = emailValidation.normalized;

    // Validate student name
    if (!studentName || typeof studentName !== 'string' || studentName.trim().length === 0) {
      console.error('Invalid student name:', studentName);
      return { success: false, error: 'Student name is required' };
    }

    // Validate FROM_EMAIL format (should never fail due to getFromEmail(), but double-check)
    if (!FROM_EMAIL || !FROM_EMAIL.includes('@')) {
      console.error('❌ Invalid FROM_EMAIL configuration:', FROM_EMAIL);
      console.error('RESEND_FROM_EMAIL env var:', process.env.RESEND_FROM_EMAIL);
      console.error('Please set RESEND_FROM_EMAIL in .env.local with format: "Name <email@domain.com>"');
      return { 
        success: false, 
        error: 'Invalid sender email configuration',
        errorDetails: `FROM_EMAIL value: "${FROM_EMAIL}". Please set RESEND_FROM_EMAIL in .env.local with format: "Name <email@domain.com>" or use default: "${DEFAULT_FROM_EMAIL}"`
      };
    }

    // Generate password setup URL if needed
    const passwordSetupUrl = needsPasswordSetup 
      ? `${SITE_URL}/setup-password?email=${encodeURIComponent(studentEmail)}`
      : `${SITE_URL}/profile/login`;

    // Email subject
    const subject = `🎉 Welcome to PanAfrican Bitcoin Academy - Your Application Has Been Approved!`;

    // Email HTML content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #e4e4e7;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #18181b; border-radius: 12px; border: 1px solid #3f3f46; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #f97316 0%, #06b6d4 100%);">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #000000;">🎉 Congratulations!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #e4e4e7;">
                Dear ${studentName},
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #e4e4e7;">
                We're thrilled to inform you that your application to <strong style="color: #f97316;">PanAfrican Bitcoin Academy</strong> has been <strong style="color: #06b6d4;">approved</strong>!
              </p>
              
              ${cohortName ? `
              <div style="margin: 30px 0; padding: 20px; background-color: #27272a; border-left: 4px solid #f97316; border-radius: 8px;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px;">Your Cohort</p>
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #f97316;">${cohortName}</p>
              </div>
              ` : ''}
              
              ${needsPasswordSetup ? `
              <p style="margin: 20px 0; font-size: 16px; line-height: 1.6; color: #e4e4e7;">
                To get started, you'll need to set up your account password. Click the button below to complete your registration:
              </p>
              
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${passwordSetupUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f97316 0%, #06b6d4 100%); color: #000000; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                      Set Up Your Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #a1a1aa;">
                Or copy and paste this link into your browser:<br>
                <a href="${passwordSetupUrl}" style="color: #06b6d4; word-break: break-all;">${passwordSetupUrl}</a>
              </p>
              ` : `
              <p style="margin: 20px 0; font-size: 16px; line-height: 1.6; color: #e4e4e7;">
                You can now log in to your account and start your Bitcoin education journey:
              </p>
              
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${passwordSetupUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f97316 0%, #06b6d4 100%); color: #000000; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                      Log In to Dashboard
                    </a>
                  </td>
                </tr>
              </table>
              `}
              
              <p style="margin: 30px 0 20px; font-size: 16px; line-height: 1.6; color: #e4e4e7;">
                <strong>What's Next?</strong>
              </p>
              
              <ul style="margin: 0; padding-left: 20px; color: #e4e4e7; font-size: 16px; line-height: 1.8;">
                <li>Complete your profile setup</li>
                <li>Explore the learning chapters and curriculum</li>
                <li>Join live sessions and connect with mentors</li>
                <li>Start earning sats as you progress</li>
                <li>Connect with fellow students in our community</li>
              </ul>
              
              <p style="margin: 30px 0 0; font-size: 16px; line-height: 1.6; color: #e4e4e7;">
                We're excited to have you join us on this journey toward Bitcoin education and financial sovereignty!
              </p>
              
              <p style="margin: 20px 0 0; font-size: 16px; line-height: 1.6; color: #e4e4e7;">
                Best regards,<br>
                <strong style="color: #f97316;">The PanAfrican Bitcoin Academy Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #18181b; border-top: 1px solid #3f3f46; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #71717a;">
                PanAfrican Bitcoin Academy<br>
                Turning Africa Orange 🌍
              </p>
              <p style="margin: 10px 0 0; font-size: 12px; color: #71717a;">
                <a href="${SITE_URL}" style="color: #06b6d4; text-decoration: none;">Visit our website</a> | 
                <a href="${SITE_URL}/about" style="color: #06b6d4; text-decoration: none;">About Us</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Plain text version
    const textContent = `
🎉 Congratulations!

Dear ${studentName},

We're thrilled to inform you that your application to PanAfrican Bitcoin Academy has been approved!

${cohortName ? `Your Cohort: ${cohortName}\n` : ''}

${needsPasswordSetup ? `
To get started, you'll need to set up your account password. Visit this link to complete your registration:
${passwordSetupUrl}
` : `
You can now log in to your account and start your Bitcoin education journey:
${passwordSetupUrl}
`}

What's Next?
- Complete your profile setup
- Explore the learning chapters and curriculum
- Join live sessions and connect with mentors
- Start earning sats as you progress
- Connect with fellow students in our community

We're excited to have you join us on this journey toward Bitcoin education and financial sovereignty!

Best regards,
The PanAfrican Bitcoin Academy Team

---
PanAfrican Bitcoin Academy
Turning Africa Orange 🌍
Visit: ${SITE_URL}
    `.trim();

    // Send email via Resend
    console.log('Sending approval email:', {
      to: normalizedEmail,
      from: FROM_EMAIL,
      studentName,
      cohortName: cohortName || 'None',
      needsPasswordSetup,
    });

    const { data: emailResponse, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: normalizedEmail, // Use normalized email
      subject: subject,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error('❌ Error sending approval email:', {
        error: error.message,
        errorName: error.name,
        errorCode: (error as any).code,
        errorDetails: JSON.stringify(error, null, 2),
        to: normalizedEmail,
        from: FROM_EMAIL,
        apiKeyPresent: !!process.env.RESEND_API_KEY,
        apiKeyLength: process.env.RESEND_API_KEY?.length || 0,
      });
      return { 
        success: false, 
        error: error.message || 'Failed to send email',
        errorDetails: process.env.NODE_ENV === 'development' ? JSON.stringify(error, null, 2) : undefined
      };
    }

    if (!emailResponse || !emailResponse.id) {
      console.error('⚠️ Email sent but no response ID received:', {
        emailResponse,
        to: normalizedEmail,
        from: FROM_EMAIL,
      });
      return { 
        success: false, 
        error: 'Email sent but no confirmation received from email service' 
      };
    }

    console.log('✅ Approval email sent successfully:', {
      emailId: emailResponse.id,
      to: normalizedEmail,
      from: FROM_EMAIL,
      studentName,
    });
    return { success: true };
  } catch (error: any) {
    console.error('❌ Exception in sendApprovalEmail:', {
      error: error.message,
      errorName: error.name,
      errorStack: error.stack,
      errorDetails: JSON.stringify(error, null, 2),
      studentEmail: data.studentEmail,
      apiKeyPresent: !!process.env.RESEND_API_KEY,
    });
    return { 
      success: false, 
      error: error.message || 'Unknown error occurred',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
      console.error('Please set RESEND_API_KEY in your environment variables (.env.local for local development)');
      return { success: false, error: 'Email service not configured' };
    }
    
    const resend = getResendClient();
    if (!resend) {
      console.error('❌ Failed to initialize Resend client even though API key exists.');
      return { success: false, error: 'Email service not configured' };
    }

    const { studentName, studentEmail, rejectionReason } = data;

    // Validate and normalize email address
    const emailValidation = validateAndNormalizeEmail(studentEmail);
    if (!emailValidation.valid || !emailValidation.normalized) {
      const errorMsg = emailValidation.error || 'Invalid email address';
      console.error('Invalid student email:', studentEmail, errorMsg);
      return { success: false, error: errorMsg };
    }

    const normalizedEmail = emailValidation.normalized;

    // Validate student name
    if (!studentName || typeof studentName !== 'string' || studentName.trim().length === 0) {
      console.error('Invalid student name:', studentName);
      return { success: false, error: 'Student name is required' };
    }

    // Validate FROM_EMAIL format (should never fail due to getFromEmail(), but double-check)
    if (!FROM_EMAIL || !FROM_EMAIL.includes('@')) {
      console.error('❌ Invalid FROM_EMAIL configuration:', FROM_EMAIL);
      console.error('RESEND_FROM_EMAIL env var:', process.env.RESEND_FROM_EMAIL);
      console.error('Please set RESEND_FROM_EMAIL in .env.local with format: "Name <email@domain.com>"');
      return { 
        success: false, 
        error: 'Invalid sender email configuration',
        errorDetails: `FROM_EMAIL value: "${FROM_EMAIL}". Please set RESEND_FROM_EMAIL in .env.local with format: "Name <email@domain.com>" or use default: "${DEFAULT_FROM_EMAIL}"`
      };
    }

    // Email subject
    const subject = `Application Update - PanAfrican Bitcoin Academy`;

    // Email HTML content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #e4e4e7;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #18181b; border-radius: 12px; border: 1px solid #3f3f46; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #f97316 0%, #06b6d4 100%);">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #000000;">Application Update</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #e4e4e7;">
                Dear ${studentName},
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #e4e4e7;">
                Thank you for your interest in <strong style="color: #f97316;">PanAfrican Bitcoin Academy</strong>. We have carefully reviewed your application.
              </p>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #27272a; border-left: 4px solid #ef4444; border-radius: 8px;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px;">Application Status</p>
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #ef4444;">Not Approved</p>
              </div>
              
              ${rejectionReason ? `
              <div style="margin: 20px 0; padding: 15px; background-color: #27272a; border-radius: 8px;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #a1a1aa; font-weight: bold;">Reason:</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #e4e4e7;">${rejectionReason}</p>
              </div>
              ` : ''}
              
              <p style="margin: 20px 0; font-size: 16px; line-height: 1.6; color: #e4e4e7;">
                We encourage you to continue learning about Bitcoin and consider applying again in the future. There are many resources available to help you prepare:
              </p>
              
              <ul style="margin: 0; padding-left: 20px; color: #e4e4e7; font-size: 16px; line-height: 1.8;">
                <li>Explore Bitcoin educational resources online</li>
                <li>Join Bitcoin communities and forums</li>
                <li>Follow our updates for future opportunities</li>
                <li>Consider reapplying when you feel ready</li>
              </ul>
              
              <p style="margin: 30px 0 0; font-size: 16px; line-height: 1.6; color: #e4e4e7;">
                We appreciate your interest in Bitcoin education and wish you the best in your learning journey.
              </p>
              
              <p style="margin: 20px 0 0; font-size: 16px; line-height: 1.6; color: #e4e4e7;">
                Best regards,<br>
                <strong style="color: #f97316;">The PanAfrican Bitcoin Academy Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #18181b; border-top: 1px solid #3f3f46; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #71717a;">
                PanAfrican Bitcoin Academy<br>
                Turning Africa Orange 🌍
              </p>
              <p style="margin: 10px 0 0; font-size: 12px; color: #71717a;">
                <a href="${SITE_URL}" style="color: #06b6d4; text-decoration: none;">Visit our website</a> | 
                <a href="${SITE_URL}/about" style="color: #06b6d4; text-decoration: none;">About Us</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Plain text version
    const textContent = `
Application Update

Dear ${studentName},

Thank you for your interest in PanAfrican Bitcoin Academy. We have carefully reviewed your application.

Application Status: Not Approved

${rejectionReason ? `Reason: ${rejectionReason}\n` : ''}

We encourage you to continue learning about Bitcoin and consider applying again in the future. There are many resources available to help you prepare:
- Explore Bitcoin educational resources online
- Join Bitcoin communities and forums
- Follow our updates for future opportunities
- Consider reapplying when you feel ready

We appreciate your interest in Bitcoin education and wish you the best in your learning journey.

Best regards,
The PanAfrican Bitcoin Academy Team

---
PanAfrican Bitcoin Academy
Turning Africa Orange 🌍
Visit: ${SITE_URL}
    `.trim();

    // Send email via Resend
    console.log('Sending rejection email:', {
      to: normalizedEmail,
      from: FROM_EMAIL,
      studentName,
      hasReason: !!rejectionReason,
    });

    const { data: emailResponse, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: normalizedEmail,
      subject: subject,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error('❌ Error sending rejection email:', {
        error: error.message,
        errorName: error.name,
        errorCode: (error as any).code,
        errorDetails: JSON.stringify(error, null, 2),
        to: normalizedEmail,
        from: FROM_EMAIL,
      });
      return { 
        success: false, 
        error: error.message || 'Failed to send email',
        errorDetails: process.env.NODE_ENV === 'development' ? JSON.stringify(error, null, 2) : undefined
      };
    }

    if (!emailResponse || !emailResponse.id) {
      console.error('⚠️ Email sent but no response ID received:', {
        emailResponse,
        to: normalizedEmail,
        from: FROM_EMAIL,
      });
      return { 
        success: false, 
        error: 'Email sent but no confirmation received from email service' 
      };
    }

    console.log('✅ Rejection email sent successfully:', {
      emailId: emailResponse.id,
      to: normalizedEmail,
      from: FROM_EMAIL,
      studentName,
    });
    return { success: true };
  } catch (error: any) {
    console.error('❌ Exception in sendRejectionEmail:', {
      error: error.message,
      errorName: error.name,
      errorStack: error.stack,
      errorDetails: JSON.stringify(error, null, 2),
      studentEmail: data.studentEmail,
      apiKeyPresent: !!process.env.RESEND_API_KEY,
    });
    return { 
      success: false, 
      error: error.message || 'Unknown error occurred',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
}
