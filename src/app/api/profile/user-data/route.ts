import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateAndNormalizeEmail } from '@/lib/validation';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * Get comprehensive user data including:
 * - Profile information
 * - Student registration status
 * - Student progress data
 * - Cohort information
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Validate email
    const emailValidation = validateAndNormalizeEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error || 'Email is required' },
        { status: 400 }
      );
    }
    const normalizedEmail = emailValidation.normalized!;

    // Get profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if user is registered as a student
    let { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle();

    // If user is enrolled in a cohort but doesn't have a student record, create it
    if (!student) {
      // Check if user is enrolled in any cohort
      const { data: enrollments } = await supabaseAdmin
        .from('cohort_enrollment')
        .select('cohort_id')
        .eq('student_id', profile.id)
        .limit(1);

      // If enrolled in a cohort, create student record
      if (enrollments && enrollments.length > 0) {
        const { data: newStudent, error: createError } = await supabaseAdmin
          .from('students')
          .insert({
            profile_id: profile.id,
            progress_percent: 0,
            assignments_completed: 0,
            projects_completed: 0,
            live_sessions_attended: 0,
          })
          .select('*')
          .single();

        if (!createError && newStudent) {
          student = newStudent;
        }
      }
    }

    // Get cohort information (from profile.cohort_id or cohort_enrollment)
    let cohort = null;
    let cohortEnrollments: any[] = [];

    // Check direct cohort_id in profile
    if (profile.cohort_id) {
      const { data: directCohort } = await supabaseAdmin
        .from('cohorts')
        .select('*')
        .eq('id', profile.cohort_id)
        .maybeSingle();
      
      if (directCohort) {
        cohort = directCohort;
      }
    }

    // Also check cohort_enrollment table (many-to-many)
    const { data: enrollments } = await supabaseAdmin
      .from('cohort_enrollment')
      .select(`
        *,
        cohorts (*)
      `)
      .eq('student_id', profile.id);

    if (enrollments && enrollments.length > 0) {
      cohortEnrollments = enrollments.map((enrollment: any) => ({
        id: enrollment.cohorts?.id,
        name: enrollment.cohorts?.name,
        startDate: enrollment.cohorts?.start_date,
        endDate: enrollment.cohorts?.end_date,
        status: enrollment.cohorts?.status,
        level: enrollment.cohorts?.level,
        enrolledAt: enrollment.enrolled_at,
      }));

      // If no direct cohort but have enrollments, use the first one
      if (!cohort && cohortEnrollments.length > 0) {
        const firstEnrollment = enrollments[0];
        if (firstEnrollment.cohorts) {
          cohort = firstEnrollment.cohorts;
        }
      }
    }

    // Get chapter progress data
    let chapterProgress = {
      completedChapters: 0,
      totalChapters: 20,
      completedChapterNumbers: [] as number[],
      chapters: [] as any[],
    };

    if (student) {
      // Get all chapter progress (unlocked and completed)
      const { data: progressData, error: progressError } = await supabaseAdmin
        .from('chapter_progress')
        .select('chapter_number, is_completed, chapter_slug, is_unlocked')
        .eq('student_id', profile.id)
        .order('chapter_number', { ascending: true });

      if (progressError) {
        console.error('Error fetching chapter progress:', progressError);
      }

      if (progressData && progressData.length > 0) {
        // Filter for completed chapters (explicitly check for true)
        const completed = progressData.filter((p: any) => p.is_completed === true);
        chapterProgress.completedChapters = completed.length;
        chapterProgress.completedChapterNumbers = completed.map((p: any) => p.chapter_number);
        
        // Build chapters list with status
        chapterProgress.chapters = progressData.map((p: any) => ({
          chapterNumber: p.chapter_number,
          chapterSlug: p.chapter_slug,
          isCompleted: p.is_completed === true,
          isUnlocked: p.is_unlocked === true,
        }));

        // Debug logging
        console.log(`[user-data] Student ${profile.id}: Found ${progressData.length} progress records, ${completed.length} completed`);
      } else {
        console.log(`[user-data] Student ${profile.id}: No chapter progress records found`);
      }
    }

    // Get achievements
    let achievements: any[] = [];
    if (student) {
      const { data: unlockedAchievements } = await supabaseAdmin
        .from('achievements')
        .select('badge_name, earned_at')
        .eq('student_id', profile.id)
        .order('earned_at', { ascending: false });

      // Import achievements definitions
      const { ACHIEVEMENTS } = await import('@/lib/achievements');
      const unlockedBadgeNames = new Set(
        (unlockedAchievements || []).map((a: any) => a.badge_name)
      );

      achievements = ACHIEVEMENTS.map((achievement) => {
        const unlocked = unlockedBadgeNames.has(achievement.badgeName);
        const unlockedData = unlockedAchievements?.find(
          (a: any) => a.badge_name === achievement.badgeName
        );

        return {
          id: achievement.id,
          title: achievement.title,
          icon: achievement.icon,
          unlocked,
          satsReward: achievement.satsReward,
          earnedAt: unlockedData?.earned_at || null,
        };
      });
    }

    // Calculate attendance percentage
    let attendancePercent = 0;
    if (student) {
      try {
        // Get total live-class events
        const { data: liveEvents } = await supabaseAdmin
          .from('events')
          .select('id')
          .eq('type', 'live-class');
        
        const totalLiveLectures = liveEvents?.length || 0;
        
        if (totalLiveLectures > 0) {
          // Get attendance records for this student
          const { data: attendanceRecords } = await supabaseAdmin
            .from('attendance')
            .select('event_id')
            .eq('student_id', profile.id);
          
          const lecturesAttended = attendanceRecords?.length || 0;
          attendancePercent = Math.round((lecturesAttended / totalLiveLectures) * 100);
        }
      } catch (err) {
        console.error('Error calculating attendance:', err);
        // Keep default 0 if calculation fails
      }
    }

    // Calculate sats totals for this student
    let satsPaid = 0;
    let satsPending = 0;
    if (student) {
      try {
        const { data: satsRewards } = await supabaseAdmin
          .from('sats_rewards')
          .select('amount_paid, amount_pending')
          .eq('student_id', profile.id);

        if (satsRewards && satsRewards.length > 0) {
          satsPaid = satsRewards.reduce(
            (sum: number, reward: any) => sum + (reward.amount_paid || 0),
            0
          );
          satsPending = satsRewards.reduce(
            (sum: number, reward: any) => sum + (reward.amount_pending || 0),
            0
          );
        }
      } catch (err) {
        console.error('Error calculating sats:', err);
        // Keep defaults (0) if calculation fails
      }
    }

    // Get student progress data if student exists
    const studentData = student ? {
      progressPercent: chapterProgress.completedChapters > 0 
        ? Math.round((chapterProgress.completedChapters / 20) * 100)
        : student.progress_percent || 0,
      assignmentsCompleted: student.assignments_completed || 0,
      projectsCompleted: student.projects_completed || 0,
      liveSessionsAttended: student.live_sessions_attended || 0,
      attendancePercent: attendancePercent,
      chaptersCompleted: chapterProgress.completedChapters,
      totalChapters: chapterProgress.totalChapters,
      completedChapterNumbers: chapterProgress.completedChapterNumbers,
      chapters: chapterProgress.chapters,
      certificateImageUrl: (student as any).certificate_image_url || null,
      satsPaid: satsPaid,
      satsPending: satsPending,
      achievements: achievements,
    } : null;

    return NextResponse.json(
      {
        profile: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          country: profile.country,
          city: profile.city,
          status: profile.status,
          photoUrl: profile.photo_url,
          studentId: profile.student_id,
        },
        isRegistered: !!student,
        student: studentData,
        cohort: cohort ? {
          id: cohort.id,
          name: cohort.name,
          startDate: cohort.start_date,
          endDate: cohort.end_date,
          status: cohort.status,
          level: cohort.level,
          sessions: cohort.sessions,
        } : null,
        cohortEnrollments,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error in user-data API:', error);
    const errorResponse = handleApiError(error);
    return NextResponse.json(
      {
        error: errorResponse.message,
        ...(errorResponse.details ? { details: errorResponse.details } : {}),
      },
      { status: errorResponse.status }
    );
  }
}

