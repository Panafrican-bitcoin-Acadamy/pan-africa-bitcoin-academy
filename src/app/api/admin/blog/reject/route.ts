import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/admin/blog/reject
 * Reject a blog submission
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const body = await request.json();
    const { submissionId, rejectionReason } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
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

    // Update submission status
    const { error: updateError } = await supabaseAdmin
      .from('blog_submissions')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason || null,
        reviewed_at: new Date().toISOString(),
        // reviewed_by: adminId, // TODO: Add admin ID from auth
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

    return NextResponse.json(
      {
        success: true,
        message: 'Blog submission rejected',
      },
      { status: 200 }
    );
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
