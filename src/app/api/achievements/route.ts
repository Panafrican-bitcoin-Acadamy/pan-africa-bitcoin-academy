import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ACHIEVEMENTS, getAchievementByBadgeName } from '@/lib/achievements';

/**
 * GET /api/achievements?email=student@example.com
 * Get all achievements for a student
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get profile ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get unlocked achievements from database
    const { data: unlockedAchievements, error: achievementsError } = await supabaseAdmin
      .from('achievements')
      .select('badge_name, earned_at')
      .eq('student_id', profile.id)
      .order('earned_at', { ascending: false });

    if (achievementsError) {
      console.error('Error fetching achievements:', achievementsError);
      return NextResponse.json(
        { error: 'Failed to fetch achievements', details: achievementsError.message },
        { status: 500 }
      );
    }

    // Build achievements list with unlock status
    const unlockedBadgeNames = new Set(
      (unlockedAchievements || []).map((a: any) => a.badge_name)
    );

    const achievements = ACHIEVEMENTS.map((achievement) => {
      const unlocked = unlockedBadgeNames.has(achievement.badgeName);
      const unlockedData = unlockedAchievements?.find(
        (a: any) => a.badge_name === achievement.badgeName
      );

      return {
        id: achievement.id,
        title: achievement.title,
        icon: achievement.icon,
        description: achievement.description,
        unlocked,
        satsReward: achievement.satsReward,
        earnedAt: unlockedData?.earned_at || null,
      };
    });

    return NextResponse.json({ achievements }, { status: 200 });
  } catch (error: any) {
    console.error('Error in achievements API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}
