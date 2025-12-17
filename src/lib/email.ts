import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'PanAfrican Bitcoin Academy <onboarding@resend.dev>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://panafricanbitcoin.com';

interface ApprovalEmailData {
  studentName: string;
  studentEmail: string;
  cohortName?: string;
  needsPasswordSetup: boolean;
}

/**
 * Send approval email to student when their application is approved
 */
export async function sendApprovalEmail(data: ApprovalEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured. Email will not be sent.');
      return { success: false, error: 'Email service not configured' };
    }

    const { studentName, studentEmail, cohortName, needsPasswordSetup } = data;

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
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: studentEmail,
      subject: subject,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error('Error sending approval email:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }

    console.log('Approval email sent successfully:', data);
    return { success: true };
  } catch (error: any) {
    console.error('Error in sendApprovalEmail:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}
