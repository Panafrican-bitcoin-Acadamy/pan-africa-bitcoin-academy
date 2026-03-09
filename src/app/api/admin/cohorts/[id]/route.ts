import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * PATCH /api/admin/cohorts/[id]
 * Update full cohort data: name, start_date, end_date, seats_total, level, status, sessions.
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: cohortId } = await context.params;
    if (!cohortId) {
      return NextResponse.json({ error: 'Cohort ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const {
      name,
      start_date,
      end_date,
      seats_total,
      level,
      status,
      sessions,
      session_duration_minutes,
    } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = String(name).trim() || null;
    if (start_date !== undefined) updates.start_date = start_date || null;
    if (end_date !== undefined) updates.end_date = end_date || null;
    if (seats_total !== undefined) updates.seats_total = seats_total == null || seats_total === '' ? null : Number(seats_total);
    if (level !== undefined) updates.level = level || 'Beginner';
    if (status !== undefined) updates.status = status || 'Upcoming';
    if (sessions !== undefined) updates.sessions = sessions == null || sessions === '' ? 0 : Number(sessions);

    if (Object.keys(updates).length === 0 && (session_duration_minutes == null || session_duration_minutes === '')) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    let cohortData: unknown = null;

    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabaseAdmin
        .from('cohorts')
        .update(updates)
        .eq('id', cohortId)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating cohort:', error);
        return NextResponse.json(
          {
            error: 'Failed to update cohort',
            ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
          },
          { status: 500 }
        );
      }
      cohortData = data;
    }

    // If session_duration_minutes provided, update all sessions of this cohort
    if (session_duration_minutes != null && session_duration_minutes !== '') {
      const duration = Number(session_duration_minutes);
      if (!Number.isNaN(duration) && duration > 0) {
        const { error: sessionsError } = await supabaseAdmin
          .from('cohort_sessions')
          .update({ duration_minutes: duration })
          .eq('cohort_id', cohortId);

        if (sessionsError) {
          console.error('Error updating cohort sessions duration:', sessionsError);
          return NextResponse.json(
            {
              error: 'Failed to update sessions duration',
              ...(process.env.NODE_ENV === 'development' ? { details: sessionsError.message } : {}),
            },
            { status: 500 }
          );
        }
      }
    }

    // Use cohort from update when available; otherwise fetch (e.g. when only session duration was updated)
    if (cohortData == null) {
      const { data, error: fetchError } = await supabaseAdmin
        .from('cohorts')
        .select('*')
        .eq('id', cohortId)
        .single();

      if (fetchError) {
        return NextResponse.json(
          { error: 'Failed to fetch updated cohort', ...(process.env.NODE_ENV === 'development' ? { details: fetchError.message } : {}) },
          { status: 500 }
        );
      }
      cohortData = data;
    }

    return NextResponse.json({ cohort: cohortData }, { status: 200 });
  } catch (err: unknown) {
    console.error('Error in PATCH /api/admin/cohorts/[id]:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
