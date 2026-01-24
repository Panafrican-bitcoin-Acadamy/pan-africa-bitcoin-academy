import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/sats
 * Get all sats rewards data for admin dashboard
 * Query params:
 * - status: Filter by status (pending, processing, paid, failed)
 * - reward_type: Filter by reward type
 * - studentId: Filter by student ID
 * - limit: Limit number of results
 */
export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const rewardType = searchParams.get('reward_type');
    const studentId = searchParams.get('studentId');
    const limit = searchParams.get('limit');

    let query = supabaseAdmin
      .from('sats_rewards')
      .select(`
        *,
        student:profiles!sats_rewards_student_id_fkey (
          id,
          name,
          email,
          student_id
        ),
        awarded_by_profile:profiles!sats_rewards_awarded_by_fkey (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (rewardType) {
      query = query.eq('reward_type', rewardType);
    }

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        query = query.limit(limitNum);
      }
    }

    const { data: rewards, error } = await query;

    if (error) {
      console.error('Error fetching sats rewards:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch sats rewards',
          ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
        },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalPaid = (rewards || []).reduce(
      (sum: number, reward: any) => sum + (reward.amount_paid || 0),
      0
    );
    const totalPending = (rewards || []).reduce(
      (sum: number, reward: any) => sum + (reward.amount_pending || 0),
      0
    );
    const totalRewards = (rewards || []).length;
    const byStatus = (rewards || []).reduce((acc: any, reward: any) => {
      const status = reward.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    const byType = (rewards || []).reduce((acc: any, reward: any) => {
      const type = reward.reward_type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json(
      {
        rewards: rewards || [],
        statistics: {
          totalPaid,
          totalPending,
          totalRewards,
          byStatus,
          byType,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in admin sats API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}

