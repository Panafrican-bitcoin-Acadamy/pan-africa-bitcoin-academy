import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, attachRefresh } from '@/lib/adminSession';
import { unlockAchievement, getAchievementByBadgeName, ACHIEVEMENTS } from '@/lib/achievements';

/**
 * POST /api/admin/achievements/unlock
 * Manually unlock an achievement for a student (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { studentEmail, badgeName } = body;

    if (!studentEmail || !badgeName) {
      return NextResponse.json(
        { error: 'studentEmail and badgeName are required' },
        { status: 400 }
      );
    }

    // Validate achievement exists
    const achievement = getAchievementByBadgeName(badgeName);
    if (!achievement) {
      return NextResponse.json(
        { error: 'Invalid achievement badge name' },
        { status: 400 }
      );
    }

    // Get student profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email')
      .eq('email', studentEmail.toLowerCase().trim())
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch student profile', details: profileError.message },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if achievement already unlocked
    const { data: existing } = await supabaseAdmin
      .from('achievements')
      .select('id, earned_at')
      .eq('student_id', profile.id)
      .eq('badge_name', badgeName)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          success: true,
          message: 'Achievement already unlocked',
          alreadyUnlocked: true,
          earnedAt: existing.earned_at,
        },
        { status: 200 }
      );
    }

    // Unlock achievement
    const result = await unlockAchievement(profile.id, badgeName, supabaseAdmin);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to unlock achievement' },
        { status: 500 }
      );
    }

    const res = NextResponse.json(
      {
        success: true,
        message: `Achievement "${achievement.title}" unlocked for ${profile.name}`,
        achievement: {
          id: achievement.id,
          title: achievement.title,
          icon: achievement.icon,
          badgeName: achievement.badgeName,
        },
        student: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
        },
      },
      { status: 200 }
    );
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('Error in admin unlock achievement API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/achievements/unlock
 * Get list of all available achievements
 */
export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const achievements = ACHIEVEMENTS.map((a) => ({
      id: a.id,
      badgeName: a.badgeName,
      title: a.title,
      icon: a.icon,
      description: a.description,
      unlockCondition: a.unlockCondition,
    }));

    const res = NextResponse.json({ achievements }, { status: 200 });
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('Error in admin achievements list API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}
