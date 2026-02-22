import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminSession';
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

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/email/received/[id]
 * Retrieve full content of a received email
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resend = getResendClient();
    if (!resend) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Email ID required' }, { status: 400 });
    }

    const result = await resend.emails.receiving.get(id);

    if (result.error) {
      console.error('Resend get received email error:', result.error);
      return NextResponse.json(
        { error: result.error.message || 'Failed to fetch email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      email: result.data,
    });
  } catch (error: unknown) {
    console.error('Error fetching received email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
