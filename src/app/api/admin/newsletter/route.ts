import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/session';
import { Resend } from 'resend';

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  try { return new Resend(apiKey); } catch { return null; }
};

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Pan-African Bitcoin Academy <noreply@panafricanbitcoin.com>';

/**
 * GET /api/admin/newsletter
 * Fetch subscribers and sent newsletters
 */
export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'subscribers';

  try {
    if (type === 'subscribers') {
      const { data: subscribers, error } = await supabaseAdmin
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (error) throw error;

      const active = (subscribers || []).filter((s: any) => s.is_active).length;
      const inactive = (subscribers || []).filter((s: any) => !s.is_active).length;

      return NextResponse.json({
        subscribers: subscribers || [],
        stats: { total: (subscribers || []).length, active, inactive },
      });
    }

    if (type === 'sent') {
      const { data: emails, error } = await supabaseAdmin
        .from('newsletter_emails')
        .select('*')
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ emails: emails || [] });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error: any) {
    console.error('[Admin Newsletter] GET error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

/**
 * POST /api/admin/newsletter
 * Send a newsletter to all active subscribers
 */
export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { subject, content } = body;

    if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
      return NextResponse.json({ error: 'Subject must be at least 3 characters' }, { status: 400 });
    }
    if (!content || typeof content !== 'string' || content.trim().length < 10) {
      return NextResponse.json({ error: 'Content must be at least 10 characters' }, { status: 400 });
    }

    const resend = getResendClient();
    if (!resend) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const { data: subscribers, error: subError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('email')
      .eq('is_active', true);

    if (subError) throw subError;

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ error: 'No active subscribers to send to' }, { status: 400 });
    }

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://panafricanbitcoin.com';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject.trim()}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.7; margin: 0; padding: 0; background-color: #0a0a0a;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
    <div style="background: linear-gradient(135deg, #ea580c 0%, #0891b2 100%); padding: 28px 24px; text-align: center; border-radius: 12px 12px 0 0;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">${subject.trim()}</h1>
    </div>
    <div style="background: #171717; padding: 32px 28px; border-radius: 0 0 12px 12px; border: 1px solid #262626; border-top: none;">
      <div style="font-size: 15px; color: #d4d4d4; white-space: pre-wrap;">${content.trim()}</div>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #262626;">
        <p style="font-size: 14px; margin: 0 0 4px; color: #fff;">Best regards,</p>
        <p style="font-size: 14px; margin: 0 0 12px; color: #d4d4d4;"><strong>Pan-African ₿itcoin Academy</strong></p>
        <p style="font-size: 11px; color: #71717a;">
          You received this because you subscribed at <a href="${SITE_URL}" style="color: #38bdf8;">${SITE_URL}</a>.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

    let successCount = 0;
    let failCount = 0;
    const batchSize = 10;

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((sub: any) =>
          resend.emails.send({
            from: FROM_EMAIL,
            to: sub.email,
            subject: subject.trim(),
            html: htmlContent,
          })
        )
      );

      results.forEach((r) => {
        if (r.status === 'fulfilled' && !r.value.error) successCount++;
        else failCount++;
      });
    }

    const { error: logError } = await supabaseAdmin
      .from('newsletter_emails')
      .insert({
        subject: subject.trim(),
        content: content.trim(),
        recipients_count: successCount,
        failed_count: failCount,
        sent_by: admin.email,
        sent_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('[Admin Newsletter] Failed to log sent email:', logError);
    }

    return NextResponse.json({
      message: `Newsletter sent to ${successCount} subscriber${successCount !== 1 ? 's' : ''}${failCount > 0 ? ` (${failCount} failed)` : ''}`,
      successCount,
      failCount,
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Admin Newsletter] POST error:', error.message);
    return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/newsletter?id=xxx
 * Remove a subscriber
 */
export async function DELETE(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Subscriber ID required' }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: 'Subscriber removed' });
  } catch (error: any) {
    console.error('[Admin Newsletter] DELETE error:', error.message);
    return NextResponse.json({ error: 'Failed to remove subscriber' }, { status: 500 });
  }
}
