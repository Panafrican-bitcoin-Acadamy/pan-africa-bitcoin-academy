import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { attachRefresh, requireAdmin } from '@/lib/adminSession';

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
          students:students(id, cohort_id, created_at),
          chapter_progress:chapter_progress(is_completed, is_unlocked, chapter_number),
          attendance:attendance(event_id, join_time, duration_minutes)
        `)
        .limit(200);

      if (result.error) {
        // If error is about missing table/column, try without relationships
        if (result.error.message?.includes('relation') || result.error.message?.includes('column')) {
          console.warn('Some relationships may not exist, fetching profiles only:', result.error.message);
          const simpleResult = await supabaseAdmin
            .from('profiles')
            .select('id, name, email, status')
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
      const cohortId = student?.cohort_id || null;
      const cohortName = cohortId ? cohortsMap.get(cohortId) || null : null;

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
      { status: 500 },
    );
  }
}


import { attachRefresh, requireAdmin } from '@/lib/adminSession';

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
          students:students(id, cohort_id, created_at),
          chapter_progress:chapter_progress(is_completed, is_unlocked, chapter_number),
          attendance:attendance(event_id, join_time, duration_minutes)
        `)
        .limit(200);

      if (result.error) {
        // If error is about missing table/column, try without relationships
        if (result.error.message?.includes('relation') || result.error.message?.includes('column')) {
          console.warn('Some relationships may not exist, fetching profiles only:', result.error.message);
          const simpleResult = await supabaseAdmin
            .from('profiles')
            .select('id, name, email, status')
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
      const cohortId = student?.cohort_id || null;
      const cohortName = cohortId ? cohortsMap.get(cohortId) || null : null;

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
      { status: 500 },
    );
  }
}

