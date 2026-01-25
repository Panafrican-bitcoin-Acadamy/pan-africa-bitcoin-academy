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
    // Strict admin authentication check
    const session = requireAdmin(request);
    if (!session) {
      console.warn('[Admin Sats API] Unauthorized access attempt from:', request.headers.get('x-forwarded-for') || 'unknown');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Log access for security auditing
    console.log(`[Admin Sats API] Authorized access by admin: ${session.email} (${session.adminId})`);

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const rewardType = searchParams.get('reward_type');
    const studentId = searchParams.get('studentId');
    const limit = searchParams.get('limit');

    let query = supabaseAdmin
      .from('sats_rewards')
      .select('*')
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

    // Fetch related profile data separately
    const studentIds = [...new Set((rewards || []).map((r: any) => r.student_id).filter(Boolean))];
    const awardedByIds = [...new Set((rewards || []).map((r: any) => r.awarded_by).filter(Boolean))];
    const allProfileIds = [...new Set([...studentIds, ...awardedByIds])];

    console.log(`[Admin Sats API] Fetching profiles for ${allProfileIds.length} unique IDs (${studentIds.length} students, ${awardedByIds.length} awarded_by)`);

    let profilesMap: Record<string, any> = {};
    if (allProfileIds.length > 0) {
      // Supabase has a limit of 1000 items in .in() queries, so we need to batch if needed
      const batchSize = 1000;
      const batches = [];
      for (let i = 0; i < allProfileIds.length; i += batchSize) {
        batches.push(allProfileIds.slice(i, i + batchSize));
      }
      
      const allProfiles: any[] = [];
      for (const batch of batches) {
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('id, name, email, student_id')
          .in('id', batch);
        
        if (profilesError) {
          console.error('[Admin Sats API] Error fetching profiles batch:', profilesError);
        } else if (profiles) {
          allProfiles.push(...profiles);
          console.log(`[Admin Sats API] Fetched ${profiles.length} profiles from batch`);
        }
      }
      
      if (allProfiles.length > 0) {
        profilesMap = allProfiles.reduce((acc: any, profile: any) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
        console.log(`[Admin Sats API] Created profiles map with ${Object.keys(profilesMap).length} entries`);
      } else {
        console.warn('[Admin Sats API] No profiles found for student IDs');
      }
    } else {
      console.warn('[Admin Sats API] No profile IDs to fetch');
    }

    // Enrich rewards with profile data
    const enrichedRewards = (rewards || []).map((reward: any) => ({
      ...reward,
      student: reward.student_id ? profilesMap[reward.student_id] || null : null,
      awarded_by_profile: reward.awarded_by ? profilesMap[reward.awarded_by] || null : null,
    }));

    // Calculate statistics from ALL data (not filtered)
    // Fetch all rewards for accurate statistics
    const { data: allRewards } = await supabaseAdmin
      .from('sats_rewards')
      .select('amount_paid, amount_pending, status, reward_type');

    const totalPaid = (allRewards || []).reduce(
      (sum: number, reward: any) => sum + (reward.amount_paid || 0),
      0
    );
    const totalPending = (allRewards || []).reduce(
      (sum: number, reward: any) => sum + (reward.amount_pending || 0),
      0
    );
    const totalRewards = (allRewards || []).length;
    const byStatus = (allRewards || []).reduce((acc: any, reward: any) => {
      const status = reward.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    const byType = (allRewards || []).reduce((acc: any, reward: any) => {
      const type = reward.reward_type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Security: Log data access for auditing
    console.log(`[Admin Sats API] Returning ${enrichedRewards.length} rewards to admin: ${session.email}`);
    
    // Return response with security headers
    const response = NextResponse.json(
      {
        rewards: enrichedRewards,
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
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    return response;
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

