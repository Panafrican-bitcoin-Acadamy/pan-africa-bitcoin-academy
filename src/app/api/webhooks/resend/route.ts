import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  try {
    return new Resend(apiKey);
  } catch {
    return null;
  }
};

/**
 * POST /api/webhooks/resend
 * Resend webhook endpoint for email.received events
 * Configure this URL in Resend Dashboard → Webhooks → Add → email.received
 * URL: https://your-domain.com/api/webhooks/resend
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const resend = getResendClient();
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (webhookSecret && resend) {
      try {
        resend.webhooks.verify({
          payload,
          headers: {
            id: req.headers.get('svix-id') ?? '',
            timestamp: req.headers.get('svix-timestamp') ?? '',
            signature: req.headers.get('svix-signature') ?? '',
          } as { id: string; timestamp: string; signature: string },
          webhookSecret,
        });
      } catch (verifyError) {
        console.error('Resend webhook signature verification failed:', verifyError);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(payload);
    if (event.type === 'email.received') {
      console.log('[Resend Webhook] Email received:', event.data?.email_id, event.data?.subject);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Resend webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
