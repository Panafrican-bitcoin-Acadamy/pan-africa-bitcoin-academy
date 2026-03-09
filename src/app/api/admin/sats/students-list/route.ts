import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/sats/students-list
 * Returns all students from the students table with aggregated sats: pending, received (paid), and total.
 */
export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: studentsData, error: studentsError } = await supabaseAdmin
      .from('students')
      .select(`
        id,
        profile_id,
        progress_percent,
        assignments_completed,
        projects_completed,
        live_sessions_attended,
        exam_score,
        exam_completed_at,
        created_at,
        updated_at,
        profiles (
          id,
          name,
          email,
          phone,
          country,
          city,
          status,
          cohort_id,
          cohorts (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (studentsError) {
      console.error('[Sats Students List] Error fetching students:', studentsError);
      return NextResponse.json(
        { error: 'Failed to fetch students', details: studentsError?.message },
        { status: 500 }
      );
    }

    const students = studentsData || [];
    const profileIds = [...new Set(students.map((s: any) => s.profile_id).filter(Boolean))];

    const { data: rewards, error: rewardsError } = await supabaseAdmin
      .from('sats_rewards')
      .select('student_id, amount_paid, amount_pending')
      .in('student_id', profileIds);

    if (rewardsError) {
      console.error('[Sats Students List] Error fetching rewards:', rewardsError);
      return NextResponse.json(
        { error: 'Failed to fetch sats rewards', details: rewardsError?.message },
        { status: 500 }
      );
    }

    const satsByStudent: Record<string, { received: number; pending: number }> = {};
    (rewards || []).forEach((r: any) => {
      const id = r.student_id;
      if (!id) return;
      if (!satsByStudent[id]) satsByStudent[id] = { received: 0, pending: 0 };
      satsByStudent[id].received += r.amount_paid ?? 0;
      satsByStudent[id].pending += r.amount_pending ?? 0;
    });

    const list = students.map((s: any, index: number) => {
      const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
      const cohort = profile?.cohorts;
      const cohortData = Array.isArray(cohort) ? cohort[0] : cohort;
      const agg = satsByStudent[s.profile_id] ?? { received: 0, pending: 0 };
      const total = agg.received + agg.pending;
      return {
        index: index + 1,
        id: s.profile_id ?? s.id,
        profile_id: s.profile_id,
        name: profile?.name ?? '',
        email: profile?.email ?? '',
        phone: profile?.phone ?? null,
        country: profile?.country ?? null,
        city: profile?.city ?? null,
        status: profile?.status ?? null,
        cohort_id: profile?.cohort_id ?? null,
        cohort_name: cohortData?.name ?? null,
        progress_percent: s.progress_percent ?? null,
        assignments_completed: s.assignments_completed ?? null,
        projects_completed: s.projects_completed ?? null,
        live_sessions_attended: s.live_sessions_attended ?? null,
        exam_score: s.exam_score ?? null,
        exam_completed_at: s.exam_completed_at ?? null,
        created_at: s.created_at ?? null,
        sats_pending: agg.pending,
        sats_received: agg.received,
        sats_total: total,
      };
    });

    return NextResponse.json(
      { students: list, total: list.length },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('[Sats Students List] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : '' },
      { status: 500 }
    );
  }
}
