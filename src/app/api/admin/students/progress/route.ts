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
      // Start from students table - only show approved students (those with records in students table)
      const { data: studentsData, error: studentsError } = await supabaseAdmin
        .from('students')
        .select('id, profile_id, cohort_id, created_at')
        .limit(200);

      if (studentsError) {
        throw studentsError;
      }

      if (!studentsData || studentsData.length === 0) {
        // No students found, return empty progress
        profiles = [];
      } else {
        // Get profile IDs from students
        const profileIds = studentsData.map((s: any) => s.profile_id).filter(Boolean);

        // Fetch profiles for these students
        const { data: profilesData, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('id, name, email, phone, status')
          .in('id', profileIds);

        if (profilesError) {
          throw profilesError;
        }

        profiles = profilesData || [];

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

    const cohortIdForProfile = (p: any): string | null => {
      const enrollments = p.cohort_enrollment || [];
      if (enrollments.length > 0) {
        const latest = [...enrollments].sort(
          (a: any, b: any) => new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime()
        )[0];
        return latest.cohort_id || null;
      }
      const student = p.students?.[0];
      return student?.cohort_id || null;
    };

    const cohortIdsForAttendance = [
      ...new Set(profiles.map(cohortIdForProfile).filter(Boolean)),
    ] as string[];

    const sessionIdsByCohort = new Map<string, Set<string>>();
    const eventIdsByCohort = new Map<string, Set<string>>();
    if (cohortIdsForAttendance.length > 0) {
      try {
        const [{ data: sessionRows }, { data: liveEventRows }] = await Promise.all([
          supabaseAdmin
            .from('cohort_sessions')
            .select('id, cohort_id')
            .in('cohort_id', cohortIdsForAttendance),
          supabaseAdmin
            .from('events')
            .select('id, cohort_id')
            .in('cohort_id', cohortIdsForAttendance)
            .eq('type', 'live-class'),
        ]);
        (sessionRows || []).forEach((s: any) => {
          if (!sessionIdsByCohort.has(s.cohort_id)) sessionIdsByCohort.set(s.cohort_id, new Set());
          sessionIdsByCohort.get(s.cohort_id)!.add(s.id);
        });
        (liveEventRows || []).forEach((e: any) => {
          if (!eventIdsByCohort.has(e.cohort_id)) eventIdsByCohort.set(e.cohort_id, new Set());
          eventIdsByCohort.get(e.cohort_id)!.add(e.id);
        });
      } catch (e) {
        console.error('Error fetching cohort sessions/events for attendance (non-critical):', e);
      }
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
      
      const student = p.students?.[0];
      let cohortId = cohortIdForProfile(p);
      let cohortName = null;

      const sessionIds = (cohortId && sessionIdsByCohort.get(cohortId)) || new Set<string>();
      const liveCohortEventIds = (cohortId && eventIdsByCohort.get(cohortId)) || new Set<string>();
      const eligibleAttendanceIds = new Set<string>([...sessionIds, ...liveCohortEventIds]);
      const attendanceDenom =
        cohortId && sessionIds.size > 0 ? sessionIds.size : liveCohortEventIds.size;
      const attendanceRecords = p.attendance || [];
      const marked = new Set(attendanceRecords.map((a: any) => a.event_id));
      let lecturesAttended = 0;
      if (attendanceDenom > 0) {
        eligibleAttendanceIds.forEach((eid) => {
          if (marked.has(eid)) lecturesAttended++;
        });
      }
      const attendancePercent =
        attendanceDenom > 0 ? Math.round((lecturesAttended / attendanceDenom) * 100) : 0;
      const totalLiveLectures = attendanceDenom;

      // Overall progress: 50% chapters + 50% attendance
      const overallProgress = Math.round((completed / 20) * 50 + attendancePercent * 0.5);
      cohortName = cohortId ? cohortsMap.get(cohortId) || null : null;

      return {
        id: p.id,
        name: p.name || 'Unnamed',
        email: p.email,
        phone: p.phone || null,
        status: p.status,
        cohortId: cohortId,
        cohortName: cohortName,
        studentId: student?.id || null,
        completedChapters: completed,
        unlockedChapters: unlocked,
        totalChapters: 21,
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
