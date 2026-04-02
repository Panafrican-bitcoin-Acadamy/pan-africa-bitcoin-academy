import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

const TOTAL_CHAPTERS = 20;

/**
 * GET /api/admin/cohorts/analytics
 * Returns per-cohort analytics: enrolled, avg progress, avg attendance, capacity, sessions.
 *
 * Progress = average chapter completion % across enrolled students (chapters completed / 20).
 * Attendance = per cohort: each student's `attendance` rows whose `event_id` is either a
 *              `cohort_sessions.id` for that cohort or a live-class `events.id` for that cohort,
 *              divided by the number of scheduled sessions (`cohort_sessions` rows), or if
 *              there are no session rows, by live-class events for that cohort (legacy).
 * Sessions completed = sessions whose date has already passed OR status is 'completed'.
 */
export async function GET(_req: NextRequest) {
  try {
    const session = requireAdmin(_req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // 1. Fetch all cohorts
    const { data: cohorts, error: cohortsError } = await supabaseAdmin
      .from('cohorts')
      .select('id, name, start_date, end_date, level, seats_total, status')
      .order('start_date', { ascending: false });

    if (cohortsError || !cohorts) {
      return NextResponse.json(
        { error: 'Failed to fetch cohorts', details: cohortsError?.message },
        { status: 500 }
      );
    }

    // 2. Enrollment: cohort_id -> set of student (profile) ids
    //    Merge two sources: cohort_enrollment table AND profiles.cohort_id
    const [{ data: enrollments }, { data: profilesWithCohort }] = await Promise.all([
      supabaseAdmin.from('cohort_enrollment').select('cohort_id, student_id'),
      supabaseAdmin.from('profiles').select('id, cohort_id').not('cohort_id', 'is', null),
    ]);

    const enrolledByCohort = new Map<string, Set<string>>();

    (enrollments || []).forEach((e: any) => {
      if (!enrolledByCohort.has(e.cohort_id)) enrolledByCohort.set(e.cohort_id, new Set());
      enrolledByCohort.get(e.cohort_id)!.add(e.student_id);
    });

    (profilesWithCohort || []).forEach((p: any) => {
      if (!enrolledByCohort.has(p.cohort_id)) enrolledByCohort.set(p.cohort_id, new Set());
      enrolledByCohort.get(p.cohort_id)!.add(p.id);
    });

    const allStudentIds = [...new Set([
      ...(enrollments || []).map((e: any) => e.student_id),
      ...(profilesWithCohort || []).map((p: any) => p.id),
    ])].filter(Boolean);

    // 3. Chapter progress: student_id -> number of completed chapters
    const completedByStudent = new Map<string, number>();
    if (allStudentIds.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < allStudentIds.length; i += batchSize) {
        const batch = allStudentIds.slice(i, i + batchSize);
        const { data: chapterProgress } = await supabaseAdmin
          .from('chapter_progress')
          .select('student_id, is_completed')
          .in('student_id', batch);

        (chapterProgress || []).forEach((cp: any) => {
          if (cp.is_completed === true) {
            completedByStudent.set(cp.student_id, (completedByStudent.get(cp.student_id) || 0) + 1);
          }
        });
      }
    }

    // 4. Cohort sessions: count total and completed + session ids per cohort (attendance keys)
    const { data: cohortSessions } = await supabaseAdmin
      .from('cohort_sessions')
      .select('id, cohort_id, session_date, status');

    const sessionsByCohort = new Map<string, { total: number; completed: number }>();
    const sessionIdsByCohort = new Map<string, Set<string>>();
    (cohortSessions || []).forEach((s: any) => {
      if (!sessionsByCohort.has(s.cohort_id)) sessionsByCohort.set(s.cohort_id, { total: 0, completed: 0 });
      if (!sessionIdsByCohort.has(s.cohort_id)) sessionIdsByCohort.set(s.cohort_id, new Set());
      sessionIdsByCohort.get(s.cohort_id)!.add(s.id);
      const t = sessionsByCohort.get(s.cohort_id)!;
      t.total++;
      if (s.status === 'completed' || (s.session_date && s.session_date <= today)) {
        t.completed++;
      }
    });

    // 5. Per-cohort attendance
    // Build map: cohort_id -> set of event ids (only live-class events assigned to a cohort)
    const { data: events } = await supabaseAdmin
      .from('events')
      .select('id, cohort_id, type');

    const eventIdsByCohort = new Map<string, Set<string>>();
    (events || []).forEach((e: any) => {
      if (e.cohort_id && e.type === 'live-class') {
        if (!eventIdsByCohort.has(e.cohort_id)) eventIdsByCohort.set(e.cohort_id, new Set());
        eventIdsByCohort.get(e.cohort_id)!.add(e.id);
      }
    });

    // Build map: student_id -> set of event_ids they attended
    const attendedByStudent = new Map<string, Set<string>>();
    if (allStudentIds.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < allStudentIds.length; i += batchSize) {
        const batch = allStudentIds.slice(i, i + batchSize);
        const { data: attendance } = await supabaseAdmin
          .from('attendance')
          .select('student_id, event_id')
          .in('student_id', batch);

        (attendance || []).forEach((a: any) => {
          if (!attendedByStudent.has(a.student_id)) attendedByStudent.set(a.student_id, new Set());
          attendedByStudent.get(a.student_id)!.add(a.event_id);
        });
      }
    }

    // 6. Build analytics per cohort
    const analytics = cohorts.map((cohort: any) => {
      const enrolledIds = enrolledByCohort.get(cohort.id) || new Set<string>();
      const enrolledCount = enrolledIds.size;
      const seats = cohort.seats_total || 0;

      // --- Avg Progress (chapter completion only) ---
      let totalProgressPct = 0;
      enrolledIds.forEach((sid: string) => {
        const done = completedByStudent.get(sid) || 0;
        totalProgressPct += Math.min(100, Math.round((done / TOTAL_CHAPTERS) * 100));
      });

      // --- Avg Attendance (cohort sessions + optional live-class events as attendance keys) ---
      const cohortSessionIds = sessionIdsByCohort.get(cohort.id) || new Set<string>();
      const cohortEventIds = eventIdsByCohort.get(cohort.id) || new Set<string>();
      const eligibleAttendanceIds = new Set<string>([...cohortSessionIds, ...cohortEventIds]);
      const attendanceDenom =
        cohortSessionIds.size > 0 ? cohortSessionIds.size : cohortEventIds.size;
      let totalAttendancePct = 0;
      if (attendanceDenom > 0) {
        enrolledIds.forEach((sid: string) => {
          const studentEvents = attendedByStudent.get(sid);
          let attended = 0;
          if (studentEvents) {
            eligibleAttendanceIds.forEach((eid: string) => {
              if (studentEvents.has(eid)) attended++;
            });
          }
          totalAttendancePct += Math.round((attended / attendanceDenom) * 100);
        });
      }

      const sess = sessionsByCohort.get(cohort.id) || { total: 0, completed: 0 };
      const avgProgress = enrolledCount > 0 ? Math.round(totalProgressPct / enrolledCount) : 0;
      const avgAttendance = enrolledCount > 0 ? Math.round(totalAttendancePct / enrolledCount) : 0;
      const seatUtilizationPct = seats > 0 ? Math.min(100, Math.round((enrolledCount / seats) * 100)) : null;
      const sessionProgressPct =
        sess.total > 0 ? Math.min(100, Math.round((sess.completed / sess.total) * 100)) : 0;

      return {
        id: cohort.id,
        name: cohort.name || 'Unnamed',
        startDate: cohort.start_date,
        endDate: cohort.end_date,
        level: cohort.level || 'Beginner',
        status: cohort.status || 'Upcoming',
        seats,
        enrolled: enrolledCount,
        avgProgress,
        avgAttendance,
        sessionsTotal: sess.total,
        sessionsCompleted: sess.completed,
        seatUtilizationPct,
        sessionProgressPct,
      };
    });

    // Trend vs chronologically prior cohort (by start_date) for avg progress
    const chrono = [...analytics].sort((a, b) => {
      const ta = a.startDate ? new Date(String(a.startDate)).getTime() : 0;
      const tb = b.startDate ? new Date(String(b.startDate)).getTime() : 0;
      if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
      if (Number.isNaN(ta)) return 1;
      if (Number.isNaN(tb)) return -1;
      return ta - tb;
    });
    const priorProgressById = new Map<string, number | null>();
    for (let i = 0; i < chrono.length; i++) {
      if (i === 0) {
        priorProgressById.set(chrono[i].id, null);
      } else {
        priorProgressById.set(chrono[i].id, chrono[i - 1].avgProgress);
      }
    }

    const analyticsWithTrend = analytics.map((row) => {
      const prev = priorProgressById.get(row.id);
      const progressVsPriorCohort =
        prev === null || prev === undefined ? null : row.avgProgress - prev;
      return { ...row, progressVsPriorCohort };
    });

    return NextResponse.json({ analytics: analyticsWithTrend }, { status: 200 });
  } catch (error: any) {
    console.error('Cohort analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cohort analytics', ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}) },
      { status: 500 }
    );
  }
}
