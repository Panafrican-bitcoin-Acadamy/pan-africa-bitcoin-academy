import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminSession';
import { Resend } from 'resend';
import { validateAndNormalizeEmail } from '@/lib/validation';

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

export async function POST(req: NextRequest) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { from, to, cc, bcc, subject, body, replyTo } = await req.json();

    // Validate required fields
    if (!to || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json(
        { error: 'At least one recipient is required' },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      return NextResponse.json(
        { error: 'Email body is required' },
        { status: 400 }
      );
    }

    // Check if body has actual content (not just empty HTML tags)
    const textContent = body.replace(/<[^>]*>/g, '').trim();
    if (textContent.length === 0) {
      return NextResponse.json(
        { error: 'Email body must contain text content' },
        { status: 400 }
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

    // Validate and normalize all email addresses
    const validateEmails = (emails: string[]): { valid: string[]; invalid: string[] } => {
      const valid: string[] = [];
      const invalid: string[] = [];

      emails.forEach(email => {
        const validation = validateAndNormalizeEmail(email);
        if (validation.valid && validation.normalized) {
          valid.push(validation.normalized);
        } else {
          invalid.push(email);
        }
      });

      return { valid, invalid };
    };

    const toValidation = validateEmails(to);
    if (toValidation.invalid.length > 0) {
      return NextResponse.json(
        { error: `Invalid recipient email(s): ${toValidation.invalid.join(', ')}` },
        { status: 400 }
      );
    }

    const ccValidation = cc && Array.isArray(cc) && cc.length > 0 ? validateEmails(cc) : { valid: [], invalid: [] };
    if (ccValidation.invalid.length > 0) {
      return NextResponse.json(
        { error: `Invalid CC email(s): ${ccValidation.invalid.join(', ')}` },
        { status: 400 }
      );
    }

    const bccValidation = bcc && Array.isArray(bcc) && bcc.length > 0 ? validateEmails(bcc) : { valid: [], invalid: [] };
    if (bccValidation.invalid.length > 0) {
      return NextResponse.json(
        { error: `Invalid BCC email(s): ${bccValidation.invalid.join(', ')}` },
        { status: 400 }
      );
    }

    // Parse "Name <email>" format for from field
    const parseFromAddress = (fromStr: string): string | null => {
      const trimmed = fromStr.trim();
      if (!trimmed) return null;
      const match = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
      if (match) {
        const [, name, email] = match;
        const emailValidation = validateAndNormalizeEmail(email.trim());
        if (emailValidation.valid && emailValidation.normalized) {
          return `${(name || '').trim()} <${emailValidation.normalized}>`;
        }
      } else {
        const emailValidation = validateAndNormalizeEmail(trimmed);
        if (emailValidation.valid && emailValidation.normalized) {
          return `PanAfrican Bitcoin Academy <${emailValidation.normalized}>`;
        }
      }
      return null;
    };

    let fromEmail = getFromEmail();
    if (from && typeof from === 'string' && from.trim().length > 0) {
      const parsed = parseFromAddress(from);
      if (parsed) fromEmail = parsed;
    }

    const emailData: Record<string, unknown> = {
      from: fromEmail,
      to: toValidation.valid,
      subject: subject.trim(),
      html: body,
    };

    if (ccValidation.valid.length > 0) {
      emailData.cc = ccValidation.valid;
    }

    if (bccValidation.valid.length > 0) {
      emailData.bcc = bccValidation.valid;
    }

    if (replyTo && typeof replyTo === 'string' && replyTo.trim().length > 0) {
      const replyValidation = validateAndNormalizeEmail(replyTo.trim());
      if (replyValidation.valid && replyValidation.normalized) {
        emailData.replyTo = replyValidation.normalized;
      }
    }

    // Send email
    try {
      console.log('Attempting to send email:', {
        from: emailData.from,
        to: emailData.to,
        cc: emailData.cc || 'none',
        bcc: emailData.bcc || 'none',
        subject: emailData.subject,
        bodyLength: emailData.html?.length || 0,
      });

      const result = await resend.emails.send(emailData);

      if (result.error) {
        console.error('Resend API error:', result.error);
        return NextResponse.json(
          { error: 'Failed to send email', details: result.error.message || JSON.stringify(result.error) },
          { status: 500 }
        );
      }

      console.log('Email sent successfully:', result.data?.id);
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        id: result.data?.id,
      });
    } catch (error: any) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error.message || 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in email send endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

