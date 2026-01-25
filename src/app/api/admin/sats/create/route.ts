import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * POST /api/admin/sats/create
 * Create a new sats reward
 */
export async function POST(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { student_id, amount_paid, amount_pending, reward_type, reason, status } = body;

    // Validate required fields
    if (!student_id) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }

    if (amount_paid === undefined && amount_pending === undefined) {
      return NextResponse.json(
        { error: 'Either amount_paid or amount_pending is required' },
        { status: 400 }
      );
    }

    // Get admin profile ID
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', session.email.toLowerCase())
      .single();

    const rewardData: any = {
      student_id,
      amount_paid: amount_paid || 0,
      amount_pending: amount_pending || 0,
      reward_type: reward_type || 'other',
      reason: reason || '',
      status: status || 'pending',
      awarded_by: adminProfile?.id || null,
    };

    const { data, error } = await supabaseAdmin
      .from('sats_rewards')
      .insert(rewardData)
      .select()
      .single();

    if (error) {
      console.error('Error creating sats reward:', error);
      return NextResponse.json(
        {
          error: 'Failed to create sats reward',
          ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ reward: data }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/sats/create:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}

