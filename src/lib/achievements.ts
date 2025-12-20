/**
 * Achievements System
 * Defines all achievements and their unlock conditions
 */

export interface Achievement {
  id: string;
  badgeName: string;
  icon: string;
  title: string;
  description: string;
  satsReward: number; // Sats awarded when achievement is unlocked
  unlockCondition: {
    type: 'chapter' | 'assignment_count' | 'assignment_specific' | 'manual';
    value?: number | string; // chapter number, assignment count, or assignment ID
  };
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'wallet_created',
    badgeName: 'wallet_created',
    icon: '🎖',
    title: 'Completed First Wallet',
    description: 'Successfully created your first Bitcoin wallet',
    satsReward: 100, // 100 sats reward
    unlockCondition: {
      type: 'chapter',
      value: 8, // Chapter 8: Exchange & Software Wallet
    },
  },
  {
    id: 'first_transaction',
    badgeName: 'first_transaction',
    icon: '🏆',
    title: 'Sent First Sats',
    description: 'Completed your first Bitcoin transaction',
    satsReward: 150, // 150 sats reward
    unlockCondition: {
      type: 'chapter',
      value: 9, // Chapter 9: UTXOs, Fees & Coin Control (covers transactions)
    },
  },
  {
    id: 'three_assignments',
    badgeName: 'three_assignments',
    icon: '🎯',
    title: '3 Assignments Done',
    description: 'Completed 3 assignments',
    satsReward: 300, // 300 sats reward
    unlockCondition: {
      type: 'assignment_count',
      value: 3,
    },
  },
  {
    id: 'lightning_user',
    badgeName: 'lightning_user',
    icon: '⚡',
    title: 'Lightning User',
    description: 'Completed Lightning Network basics',
    satsReward: 250, // 250 sats reward
    unlockCondition: {
      type: 'chapter',
      value: 12, // Chapter 12: Lightning Basics
    },
  },
  {
    id: 'recovery_master',
    badgeName: 'recovery_master',
    icon: '🔐',
    title: 'Recovery Master',
    description: 'Mastered wallet backup and recovery',
    satsReward: 200, // 200 sats reward
    unlockCondition: {
      type: 'chapter',
      value: 10, // Chapter 10: Backup & Recovery (or could be 11: Hardware Signers)
    },
  },
  // Future achievements (not yet implemented):
  // {
  //   id: 'ten_chapters',
  //   badgeName: 'ten_chapters',
  //   icon: '📚',
  //   title: '10 Chapters Done',
  //   description: 'Completed 10 chapters',
  //   satsReward: 500,
  //   unlockCondition: {
  //     type: 'chapter_count',
  //     value: 10,
  //   },
  // },
  // {
  //   id: 'perfect_attendance',
  //   badgeName: 'perfect_attendance',
  //   icon: '⭐',
  //   title: 'Perfect Attendance',
  //   description: 'Attended all live sessions',
  //   satsReward: 1000,
  //   unlockCondition: {
  //     type: 'attendance_percent',
  //     value: 100,
  //   },
  // },
];

/**
 * Get achievement by ID
 */
export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/**
 * Get achievement by badge name
 */
export function getAchievementByBadgeName(badgeName: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.badgeName === badgeName);
}

/**
 * Check if an achievement should be unlocked based on unlock condition
 */
export async function checkAchievementUnlock(
  achievement: Achievement,
  studentId: string,
  supabaseAdmin: any
): Promise<boolean> {
  const { unlockCondition } = achievement;

  switch (unlockCondition.type) {
    case 'chapter': {
      // Check if student completed the required chapter
      const chapterNumber = unlockCondition.value as number;
      const { data: progress } = await supabaseAdmin
        .from('chapter_progress')
        .select('is_completed')
        .eq('student_id', studentId)
        .eq('chapter_number', chapterNumber)
        .eq('is_completed', true)
        .maybeSingle();

      return !!progress;
    }

    case 'assignment_count': {
      // Check if student completed required number of assignments
      const requiredCount = unlockCondition.value as number;
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('assignments_completed')
        .eq('profile_id', studentId)
        .maybeSingle();

      return (student?.assignments_completed || 0) >= requiredCount;
    }

    case 'assignment_specific': {
      // Check if student completed a specific assignment
      const assignmentId = unlockCondition.value as string;
      const { data: submission } = await supabaseAdmin
        .from('assignment_submissions')
        .select('id')
        .eq('student_id', studentId)
        .eq('assignment_id', assignmentId)
        .eq('is_correct', true)
        .maybeSingle();

      return !!submission;
    }

    case 'manual':
      // Manual achievements are unlocked by admins
      return false;

    default:
      return false;
  }
}

/**
 * Unlock an achievement for a student
 */
export async function unlockAchievement(
  studentId: string,
  badgeName: string,
  supabaseAdmin: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if achievement already exists
    const { data: existing } = await supabaseAdmin
      .from('achievements')
      .select('id')
      .eq('student_id', studentId)
      .eq('badge_name', badgeName)
      .maybeSingle();

    if (existing) {
      // Achievement already unlocked
      return { success: true };
    }

    // Get achievement details
    const achievement = getAchievementByBadgeName(badgeName);
    if (!achievement) {
      return { success: false, error: 'Achievement not found' };
    }

    // Insert achievement
    const { error } = await supabaseAdmin.from('achievements').insert({
      student_id: studentId,
      badge_name: badgeName,
      points: 0, // Can be customized per achievement
      description: achievement.description,
      earned_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error unlocking achievement:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in unlockAchievement:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check and unlock achievements for a student based on their progress
 * Returns list of newly unlocked achievement IDs
 */
export async function checkAndUnlockAchievements(
  studentId: string,
  supabaseAdmin: any
): Promise<Array<{ id: string; title: string; icon: string; satsReward: number }>> {
  const newlyUnlocked: Array<{ id: string; title: string; icon: string; satsReward: number }> = [];

  for (const achievement of ACHIEVEMENTS) {
    // Skip manual achievements
    if (achievement.unlockCondition.type === 'manual') {
      continue;
    }

    // Check if already unlocked
    const { data: existing } = await supabaseAdmin
      .from('achievements')
      .select('id')
      .eq('student_id', studentId)
      .eq('badge_name', achievement.badgeName)
      .maybeSingle();

    if (existing) {
      continue; // Already unlocked
    }

    // Check unlock condition
    const shouldUnlock = await checkAchievementUnlock(achievement, studentId, supabaseAdmin);

    if (shouldUnlock) {
      const result = await unlockAchievement(studentId, achievement.badgeName, supabaseAdmin);
      if (result.success && result.achievement) {
        newlyUnlocked.push({
          id: achievement.id,
          title: achievement.title,
          icon: achievement.icon,
          satsReward: achievement.satsReward,
        });
      }
    }
  }

  return newlyUnlocked;
}
