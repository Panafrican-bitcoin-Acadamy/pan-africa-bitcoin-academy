import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWithdrawalRequestEmail } from '@/lib/email';
import { requireStudent } from '@/lib/session';

/**
 * POST /api/sats/withdraw
 * Handle withdrawal request - sends email notification to admin
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = requireStudent(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    // Get student profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, student_id, cohort_id')
      .eq('id', session.userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get student's sats balance
    const { data: satsRewards, error: satsError } = await supabaseAdmin
      .from('sats_rewards')
      .select('amount_paid, amount_pending')
      .eq('student_id', profile.id);

    if (satsError) {
      console.error('Error fetching sats rewards:', satsError);
      return NextResponse.json(
        { error: 'Failed to fetch sats balance' },
        { status: 500 }
      );
    }

    // Calculate totals
    const satsEarned = (satsRewards || []).reduce(
      (sum: number, reward: any) => sum + (reward.amount_paid || 0),
      0
    );
    const satsPending = (satsRewards || []).reduce(
      (sum: number, reward: any) => sum + (reward.amount_pending || 0),
      0
    );

    // Get cohort name if available
    let cohortName: string | undefined;
    if (profile.cohort_id) {
      const { data: cohort } = await supabaseAdmin
        .from('cohorts')
        .select('name')
        .eq('id', profile.cohort_id)
        .single();
      cohortName = cohort?.name;
    }

    if (satsPending <= 0) {
      return NextResponse.json(
        { error: 'You have no pending sats to withdraw yet.' },
        { status: 400 }
      );
    }

    // Prevent duplicate requests for the same pending-sats snapshot
    const { data: existingRequest, error: existingRequestError } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('id, status, pending_snapshot_sats, requested_at')
      .eq('student_id', profile.id)
      .eq('pending_snapshot_sats', satsPending)
      .eq('status', 'requested')
      .maybeSingle();

    if (existingRequestError) {
      console.error('Error checking existing withdrawal request:', existingRequestError);
      return NextResponse.json(
        { error: 'Failed to validate withdrawal request state' },
        { status: 500 }
      );
    }

    if (existingRequest) {
      return NextResponse.json(
        {
          success: false,
          alreadyRequested: true,
          pendingSnapshotSats: satsPending,
          message: 'You already requested withdrawal for your current pending sats. You can request again when new pending sats are added.'
        },
        { status: 409 }
      );
    }

    const { error: insertRequestError } = await supabaseAdmin
      .from('withdrawal_requests')
      .insert({
        student_id: profile.id,
        pending_snapshot_sats: satsPending,
        status: 'requested',
      });

    if (insertRequestError) {
      console.error('Error creating withdrawal request record:', insertRequestError);
      return NextResponse.json(
        { error: 'Failed to create withdrawal request' },
        { status: 500 }
      );
    }

    // Send withdrawal request email to admin
    const emailResult = await sendWithdrawalRequestEmail({
      studentName: profile.name || 'Unknown Student',
      studentEmail: profile.email,
      studentId: profile.student_id || undefined,
      satsEarned,
      satsPending,
      cohortName,
    });

    if (!emailResult.success) {
      console.error('Failed to send withdrawal email:', emailResult.error);
      return NextResponse.json(
        { 
          error: 'Failed to send withdrawal request',
          details: emailResult.error 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully. You will receive your sats via Lightning Network soon.',
      pendingSnapshotSats: satsPending,
    });
  } catch (error: any) {
    console.error('Error in withdrawal request:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}

