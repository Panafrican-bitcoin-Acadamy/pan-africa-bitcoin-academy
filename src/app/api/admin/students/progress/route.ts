import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { attachRefresh, requireAdmin } from '@/lib/adminSession';

/**
 * Admin endpoint to fetch student progress data
 * Returns progress information for all students including:
 * - Chapter completion status
 * - Attendance records
 * - Cohort assignments
 */
export async function GET(_req: NextRequest) {
  try {
    const session = requireAdmin(_req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch profiles with students, chapter_progress, and attendance relationships
    // Note: profiles table uses 'name' not 'first_name'/'last_name'
    // Handle cases where related tables might not exist yet
    let profiles: any[] = [];
    let error: any = null;

    // First, fetch all cohorts to map cohort_id to cohort name
    const { data: cohortsData } = await supabaseAdmin
      .from('cohorts')
      .select('id, name');
    
    const cohortsMap = new Map<string, string>();
    if (cohortsData) {
      cohortsData.forEach((c: any) => {
        cohortsMap.set(c.id, c.name);
      });
    }

    try {
      // Fetch profiles first - only show Active students (approved and enrolled)
      const { data: profilesData, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, name, email, status')
        .eq('status', 'Active')
        .limit(200);

      if (profilesError) {
        throw profilesError;
      }

      profiles = profilesData || [];

      if (profiles.length === 0) {
        // No profiles found, return empty progress
        profiles = [];
      } else {
        // Fetch related data separately for better reliability
        const profileIds = profiles.map((p: any) => p.id);

        // Fetch students data
        const { data: studentsData } = await supabaseAdmin
          .from('students')
          .select('id, profile_id, cohort_id, created_at')
          .in('profile_id', profileIds);

        // Fetch chapter progress data - this is critical for tracking completion
        const { data: chapterProgressData, error: chapterProgressError } = await supabaseAdmin
          .from('chapter_progress')
          .select('student_id, is_completed, is_unlocked, chapter_number')
          .in('student_id', profileIds);

        if (chapterProgressError) {
          console.error('[admin/students/progress] Error fetching chapter progress:', chapterProgressError);
          // Continue with empty chapter progress data
        } else {
          console.log(`[admin/students/progress] Fetched ${chapterProgressData?.length || 0} chapter progress records for ${profileIds.length} profiles`);
          // Debug: Log sample data
          if (chapterProgressData && chapterProgressData.length > 0) {
            const completedCount = chapterProgressData.filter((cp: any) => cp.is_completed === true).length;
            console.log(`[admin/students/progress] Found ${completedCount} completed chapters out of ${chapterProgressData.length} total records`);
          }
        }

        // Fetch attendance data
        const { data: attendanceData } = await supabaseAdmin
          .from('attendance')
          .select('student_id, event_id, join_time, duration_minutes')
          .in('student_id', profileIds);

        // Fetch cohort enrollment data
        const { data: enrollmentData } = await supabaseAdmin
          .from('cohort_enrollment')
          .select('student_id, cohort_id, enrolled_at')
          .in('student_id', profileIds);

        // Attach related data to profiles
        profiles = profiles.map((profile: any) => {
          const profileId = profile.id;
          const studentProgress = chapterProgressData?.filter((cp: any) => cp.student_id === profileId) || [];
          
          // Debug: Log if we're not finding progress for a student who should have it
          const hasStudentRecord = studentsData?.some((s: any) => s.profile_id === profileId);
          if (studentProgress.length === 0 && hasStudentRecord) {
            // Only log for students (to avoid spam for non-students)
            console.log(`[admin/students/progress] No chapter progress found for student ${profile.email} (profile_id: ${profileId})`);
          }
          
          return {
            ...profile,
            students: studentsData?.filter((s: any) => s.profile_id === profileId) || [],
            chapter_progress: studentProgress,
            attendance: attendanceData?.filter((a: any) => a.student_id === profileId) || [],
            cohort_enrollment: enrollmentData?.filter((e: any) => e.student_id === profileId) || [],
          };
        });
      }
    } catch (fetchError: any) {
      console.error('Error fetching profiles:', fetchError);
      error = fetchError;
    }

    if (error) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch student progress',
          ...(process.env.NODE_ENV === 'development' 
            ? { 
                details: error.message,
                hint: 'Make sure all database tables (profiles, students, chapter_progress, attendance) exist'
              }
            : {})
        },
        { status: 500 }
      );
    }

    // Get total live-class events count for attendance calculation
    let totalLiveLectures = 0;
    try {
      const { data: liveEvents, error: eventsError } = await supabaseAdmin
        .from('events')
        .select('id')
        .eq('type', 'live-class');
      
      if (eventsError) {
        console.error('Error fetching live events (non-critical):', eventsError);
      } else {
        totalLiveLectures = liveEvents?.length || 0;
      }
    } catch (eventsError) {
      console.error('Error fetching live events (non-critical):', eventsError);
      // Continue without attendance data
    }

    // Map profiles to progress data
    const progress = profiles.map((p: any) => {
      const chapterData = p.chapter_progress || [];
      // Filter for completed chapters - check explicitly for true (handles null/undefined/false)
      const completed = chapterData.filter((c: any) => c.is_completed === true).length;
      const unlocked = chapterData.length;
      
      // Debug logging for first few students
      if (profiles.indexOf(p) < 3) {
        console.log(`[admin/students/progress] Student ${p.email}: ${chapterData.length} progress records, ${completed} completed`);
      }
      
      // Calculate attendance
      const attendanceRecords = p.attendance || [];
      const lecturesAttended = attendanceRecords.length;
      const attendancePercent = totalLiveLectures > 0 
        ? Math.round((lecturesAttended / totalLiveLectures) * 100)
        : 0;

      // Overall progress: 50% chapters + 50% attendance
      const overallProgress = Math.round((completed / 20) * 50 + attendancePercent * 0.5);

      const student = p.students?.[0];
      // Get cohort from cohort_enrollment (source of truth) first, fallback to students.cohort_id
      let cohortId = null;
      let cohortName = null;
      
      // cohort_enrollment is the source of truth for student enrollments
      const enrollments = p.cohort_enrollment || [];
      if (enrollments.length > 0) {
        // If multiple enrollments, use the most recent one
        const latestEnrollment = enrollments.sort((a: any, b: any) => 
          new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime()
        )[0];
        cohortId = latestEnrollment.cohort_id;
      } else {
        // Fallback to students.cohort_id if no enrollment record exists
        cohortId = student?.cohort_id || null;
      }
      
      cohortName = cohortId ? cohortsMap.get(cohortId) || null : null;

      return {
        id: p.id,
        name: p.name || 'Unnamed',
        email: p.email,
        status: p.status,
        cohortId: cohortId,
        cohortName: cohortName,
        studentId: student?.id || null,
        completedChapters: completed,
        unlockedChapters: unlocked,
        totalChapters: 20, // Assuming 20 chapters total
        lecturesAttended,
        totalLiveLectures,
        attendancePercent,
        overallProgress,
      };
    });

    const res = NextResponse.json({ progress }, { status: 200 });
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('Error in admin students progress API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}
