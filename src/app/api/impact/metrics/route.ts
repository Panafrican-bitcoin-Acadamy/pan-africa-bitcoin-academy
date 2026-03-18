import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(_req: NextRequest) {
  try {
    // 1. Total Students Trained (count approved applications)
    const { count: totalStudentsTrained, error: applicationsError } = await supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Approved');

    if (applicationsError) {
      console.error('Error fetching approved applications:', applicationsError);
    }

    // 2. Cohorts Completed: cohorts where ALL sessions are completed
    // (computed from cohort_sessions - source of truth)
    let cohortsCompleted = 0;
    const { data: allSessions, error: sessionsErr } = await supabaseAdmin
      .from('cohort_sessions')
      .select('cohort_id, status');

    if (!sessionsErr && allSessions && allSessions.length > 0) {
      const sessionsByCohort = new Map<string, { total: number; completed: number }>();
      for (const s of allSessions) {
        const cid = s.cohort_id;
        if (!sessionsByCohort.has(cid)) {
          sessionsByCohort.set(cid, { total: 0, completed: 0 });
        }
        const t = sessionsByCohort.get(cid)!;
        t.total++;
        if (s.status === 'completed') t.completed++;
      }
      // Cohort is completed if it has at least 1 session and all are completed
      for (const [, t] of sessionsByCohort) {
        if (t.total > 0 && t.total === t.completed) {
          cohortsCompleted++;
        }
      }
    }

    // 3. Countries Reached (distinct countries from students)
    const { data: studentsData, error: countriesError } = await supabaseAdmin
      .from('students')
      .select('country');

    let countriesReached = 0;
    if (!countriesError && studentsData) {
      // Get distinct countries (filter out null/empty values)
      const distinctCountries = new Set(
        studentsData
          .map((s) => s.country)
          .filter((c) => c && c.trim() !== '')
      );
      countriesReached = distinctCountries.size;
    }

    // 4. Assignments Submitted (sum of assignments_completed from students)
    const { data: allStudents, error: assignmentsError } = await supabaseAdmin
      .from('students')
      .select('assignments_completed');

    let assignmentsSubmitted = 0;
    if (!assignmentsError && allStudents) {
      assignmentsSubmitted = allStudents.reduce(
        (sum, student) => sum + (student.assignments_completed || 0),
        0
      );
    }

    // 5. Teaching Hours (1 hour per completed cohort session)
    const { count: completedSessionsCount, error: sessionsError } = await supabaseAdmin
      .from('cohort_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    let sessionTeachingHours = 0;
    if (!sessionsError && completedSessionsCount != null) {
      sessionTeachingHours = completedSessionsCount; // 1 hour per completed cohort session
    }

    // 6. Event hours from events marked Done — add into Teaching Hours total
    let eventsCompleted = 0;
    let eventHoursFromEvents = 0;
    try {
      const { data: completedEvents, error: eventsError } = await supabaseAdmin
        .from('events')
        .select('id, duration_minutes')
        .eq('status', 'completed');

      if (!eventsError && completedEvents && completedEvents.length > 0) {
        eventsCompleted = completedEvents.length;
        eventHoursFromEvents = completedEvents.reduce(
          (sum, e: { duration_minutes?: number | null }) =>
            sum + (e.duration_minutes != null ? e.duration_minutes / 60 : 0),
          0
        );
      }
    } catch (_) {
      // events table may not have status/duration_minutes yet
    }

    const teachingHours =
      Math.round((sessionTeachingHours + eventHoursFromEvents) * 10) / 10;

    return NextResponse.json(
      {
        totalStudentsTrained: totalStudentsTrained || 0,
        cohortsCompleted: cohortsCompleted || 0,
        countriesReached: countriesReached || 0,
        assignmentsSubmitted: assignmentsSubmitted || 0,
        teachingHours,
        eventsCompleted: eventsCompleted || 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching impact metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch impact metrics',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}

