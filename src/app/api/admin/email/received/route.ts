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

/**
 * GET /api/admin/email/received
 * List received (inbound) emails from Resend
 * Requires admin authentication
 * Requires Resend Receiving to be enabled (paid feature)
 */
export async function GET(req: NextRequest) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resend = getResendClient();
    if (!resend) {
      return NextResponse.json(
        { error: 'Email service not configured. Please set RESEND_API_KEY in environment variables.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const after = searchParams.get('after') || undefined;

    const result = await resend.emails.receiving.list({
      limit,
      ...(after && { after }),
    });

    if (result.error) {
      console.error('Resend received emails error:', result.error);
      return NextResponse.json(
        {
          error: result.error.message || 'Failed to fetch received emails',
          details: result.error.message,
        },
        { status: 500 }
      );
    }

    const listData = result.data?.data;
    if (!listData) {
      return NextResponse.json({
        success: true,
        emails: [],
        hasMore: false,
      });
    }

    return NextResponse.json({
      success: true,
      emails: listData,
      hasMore: result.data?.has_more ?? false,
    });
  } catch (error: unknown) {
    console.error('Error in email received endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
