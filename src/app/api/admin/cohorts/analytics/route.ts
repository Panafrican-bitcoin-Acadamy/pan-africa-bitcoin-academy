import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/cohorts/analytics
 * Returns per-cohort analytics: enrolled, avg progress, avg attendance, capacity, sessions, etc.
 */
export async function GET(_req: NextRequest) {
  try {
    const session = requireAdmin(_req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // 2. For each cohort: enrolled count from cohort_enrollment
    const { data: enrollments } = await supabaseAdmin
      .from('cohort_enrollment')
      .select('cohort_id, student_id');

    const enrolledByCohort = new Map<string, Set<string>>();
    (enrollments || []).forEach((e: any) => {
      if (!enrolledByCohort.has(e.cohort_id)) enrolledByCohort.set(e.cohort_id, new Set());
      enrolledByCohort.get(e.cohort_id)!.add(e.student_id);
    });

    // 3. Get profiles with chapter_progress and attendance for enrolled students
    const allStudentIds = [...new Set((enrollments || []).map((e: any) => e.student_id))];
    const studentIds = allStudentIds.filter(Boolean).slice(0, 500); // Limit for performance

    let progressByProfile = new Map<string, { completed: number; attendance: number }>();
    let totalLiveLectures = 0;

    if (studentIds.length > 0) {
      // Chapter progress
      const { data: chapterProgress } = await supabaseAdmin
        .from('chapter_progress')
        .select('student_id, is_completed')
        .in('student_id', studentIds);

      (chapterProgress || []).forEach((cp: any) => {
        if (!progressByProfile.has(cp.student_id)) progressByProfile.set(cp.student_id, { completed: 0, attendance: 0 });
        const p = progressByProfile.get(cp.student_id)!;
        if (cp.is_completed === true) p.completed++;
      });

      // Live-class events count
      const { count } = await supabaseAdmin
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'live-class');
      totalLiveLectures = count || 0;

      // Attendance
      const { data: attendance } = await supabaseAdmin
        .from('attendance')
        .select('student_id')
        .in('student_id', studentIds);

      (attendance || []).forEach((a: any) => {
        if (!progressByProfile.has(a.student_id)) progressByProfile.set(a.student_id, { completed: 0, attendance: 0 });
        const p = progressByProfile.get(a.student_id)!;
        p.attendance++;
      });
    }

    // 4. Count cohort_sessions per cohort (completed vs total)
    const { data: cohortSessions } = await supabaseAdmin
      .from('cohort_sessions')
      .select('cohort_id, status');

    const sessionsByCohort = new Map<string, { total: number; completed: number }>();
    (cohortSessions || []).forEach((s: any) => {
      if (!sessionsByCohort.has(s.cohort_id)) sessionsByCohort.set(s.cohort_id, { total: 0, completed: 0 });
      const t = sessionsByCohort.get(s.cohort_id)!;
      t.total++;
      if (s.status === 'completed') t.completed++;
    });

    // 5. Build analytics per cohort
    const analytics = cohorts.map((cohort: any) => {
      const enrolledIds = enrolledByCohort.get(cohort.id) || new Set();
      const enrolledCount = enrolledIds.size;
      const seats = cohort.seats_total || 0;

      let totalProgress = 0;
      let totalAttendance = 0;
      let studentCount = 0;
      enrolledIds.forEach((profileId: string) => {
        const p = progressByProfile.get(profileId);
        if (p) {
          const chapterProgressPct = Math.round((p.completed / 20) * 50); // 20 chapters, 50% weight
          const attendPct = totalLiveLectures > 0 ? Math.round((p.attendance / totalLiveLectures) * 100) : 0;
          const overallPct = Math.round((p.completed / 20) * 50 + attendPct * 0.5);
          totalProgress += Math.min(100, overallPct);
          totalAttendance += Math.min(100, attendPct);
          studentCount++;
        }
      });

      const sess = sessionsByCohort.get(cohort.id) || { total: 0, completed: 0 };
      return {
        id: cohort.id,
        name: cohort.name || 'Unnamed',
        startDate: cohort.start_date,
        endDate: cohort.end_date,
        level: cohort.level || 'Beginner',
        status: cohort.status || 'Upcoming',
        seats,
        enrolled: enrolledCount,
        avgProgress: studentCount > 0 ? Math.round(totalProgress / studentCount) : 0,
        avgAttendance: studentCount > 0 ? Math.round(totalAttendance / studentCount) : 0,
        sessionsTotal: sess.total,
        sessionsCompleted: sess.completed,
      };
    });

    return NextResponse.json({ analytics }, { status: 200 });
  } catch (error: any) {
    console.error('Cohort analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cohort analytics', ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}) },
      { status: 500 }
    );
  }
}
