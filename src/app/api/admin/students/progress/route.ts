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
      const result = await supabaseAdmin
        .from('profiles')
        .select(`
          id,
          name,
          email,
          status,
          cohort_id,
          students:students(id, cohort_id, created_at),
          chapter_progress:chapter_progress(is_completed, is_unlocked, chapter_number),
          attendance:attendance(event_id, join_time, duration_minutes),
          cohort_enrollment:cohort_enrollment(cohort_id, cohorts(name))
        `)
        .limit(200);

      if (result.error) {
        // If error is about missing table/column, try without relationships
        if (result.error.message?.includes('relation') || result.error.message?.includes('column')) {
          console.warn('Some relationships may not exist, fetching profiles only:', result.error.message);
          const simpleResult = await supabaseAdmin
            .from('profiles')
            .select('id, name, email, status, cohort_id')
            .limit(200);
          
          if (simpleResult.error) {
            throw simpleResult.error;
          }
          profiles = simpleResult.data || [];
        } else {
          throw result.error;
        }
      } else {
        profiles = result.data || [];
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

    // If we don't have cohort_enrollment data in the query, fetch it separately for profiles that need it
    const profilesNeedingCohort: string[] = [];
    profiles.forEach((p: any) => {
      if (!p.cohort_id && (!p.students || !p.students[0]?.cohort_id) && (!p.cohort_enrollment || p.cohort_enrollment.length === 0)) {
        profilesNeedingCohort.push(p.id);
      }
    });

    // Fetch cohort_enrollment for profiles that don't have cohort info
    const enrollmentMap = new Map<string, string>(); // profile_id -> cohort_id
    if (profilesNeedingCohort.length > 0) {
      try {
        const { data: enrollments } = await supabaseAdmin
          .from('cohort_enrollment')
          .select('student_id, cohort_id')
          .in('student_id', profilesNeedingCohort);
        
        if (enrollments) {
          enrollments.forEach((e: any) => {
            enrollmentMap.set(e.student_id, e.cohort_id);
          });
        }
      } catch (enrollmentError) {
        console.warn('Error fetching cohort enrollments (non-critical):', enrollmentError);
      }
    }

    // Map profiles to progress data
    const progress = profiles.map((p: any) => {
      const chapterData = p.chapter_progress || [];
      const completed = chapterData.filter((c: any) => c.is_completed).length;
      const unlocked = chapterData.length;
      
      // Calculate attendance
      const attendanceRecords = p.attendance || [];
      const lecturesAttended = attendanceRecords.length;
      const attendancePercent = totalLiveLectures > 0 
        ? Math.round((lecturesAttended / totalLiveLectures) * 100)
        : 0;

      // Overall progress: 50% chapters + 50% attendance
      const overallProgress = Math.round((completed / 20) * 50 + attendancePercent * 0.5);

      const student = p.students?.[0];
      
      // Get cohort from multiple sources (priority order):
      // 1. From profile.cohort_id (direct assignment)
      // 2. From students.cohort_id (if exists)
      // 3. From cohort_enrollment (many-to-many relationship - from query)
      // 4. From cohort_enrollment (many-to-many relationship - from fallback query)
      let cohortId: string | null = null;
      let cohortName: string | null = null;
      
      // First, check profile.cohort_id
      if (p.cohort_id) {
        cohortId = p.cohort_id;
        cohortName = cohortsMap.get(p.cohort_id) || null;
      }
      
      // If not found, check students.cohort_id
      if (!cohortId && student?.cohort_id) {
        cohortId = student.cohort_id;
        cohortName = cohortsMap.get(student.cohort_id) || null;
      }
      
      // If still not found, check cohort_enrollment from query
      if (!cohortId && p.cohort_enrollment && Array.isArray(p.cohort_enrollment) && p.cohort_enrollment.length > 0) {
        const enrollment = p.cohort_enrollment[0];
        if (enrollment.cohort_id) {
          cohortId = enrollment.cohort_id;
          // Try to get name from the nested cohort data first
          if (enrollment.cohorts && enrollment.cohorts.name) {
            cohortName = enrollment.cohorts.name;
          } else {
            cohortName = cohortsMap.get(enrollment.cohort_id) || null;
          }
        }
      }
      
      // Final fallback: check enrollmentMap from separate query
      if (!cohortId) {
        const fallbackCohortId = enrollmentMap.get(p.id);
        if (fallbackCohortId) {
          cohortId = fallbackCohortId;
          cohortName = cohortsMap.get(fallbackCohortId) || null;
        }
      }

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
