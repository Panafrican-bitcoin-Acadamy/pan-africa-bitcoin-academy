import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, attachRefresh } from '@/lib/adminSession';
import { validateUUID, secureTextInput } from '@/lib/security-utils';
import { logAdminAction, AUDIT_ACTIONS } from '@/lib/audit-log';

/**
 * POST /api/admin/blog/reject
 * Reject a blog submission (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { submissionId, rejectionReason } = body;

    // Security: Validate submissionId format (UUID)
    if (!submissionId || !validateUUID(submissionId)) {
      return NextResponse.json(
        { error: 'Invalid submission ID format' },
        { status: 400 }
      );
    }

    // Security: Sanitize rejection reason if provided
    let sanitizedReason = null;
    if (rejectionReason) {
      const reasonValidation = secureTextInput(rejectionReason, { maxLength: 1000 });
      if (reasonValidation.valid && reasonValidation.sanitized) {
        sanitizedReason = reasonValidation.sanitized;
      } else {
        return NextResponse.json(
          { error: reasonValidation.error || 'Invalid rejection reason format' },
          { status: 400 }
        );
      }
    }

    // Get the submission
    const { data: submission, error: subError } = await supabaseAdmin
      .from('blog_submissions')
      .select('*')
      .eq('id', submissionId)
      .maybeSingle();

    if (subError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    if (submission.status !== 'pending') {
      return NextResponse.json(
        { error: 'Submission has already been reviewed' },
        { status: 400 }
      );
    }

    // Security: Log rejection action for audit
    logAdminAction(
      AUDIT_ACTIONS.BLOG_REJECTED,
      session.adminId,
      session.email,
      'blog_submission',
      {
        resourceId: submissionId,
        details: {
          submissionTitle: submission.title,
          authorEmail: submission.author_email,
          rejectionReason: sanitizedReason || 'Not provided',
        },
      }
    );

    // Update submission status
    const { error: updateError } = await supabaseAdmin
      .from('blog_submissions')
      .update({
        status: 'rejected',
        rejection_reason: sanitizedReason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: session.adminId,
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Error rejecting submission:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to reject submission',
          ...(process.env.NODE_ENV === 'development' ? { details: updateError.message } : {}),
        },
        { status: 500 }
      );
    }

    const res = NextResponse.json(
      {
        success: true,
        message: 'Blog submission rejected',
      },
      { status: 200 }
    );
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('Error in reject blog API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}
