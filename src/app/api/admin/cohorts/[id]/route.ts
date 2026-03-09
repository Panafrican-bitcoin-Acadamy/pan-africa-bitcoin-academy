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
    } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = String(name).trim() || null;
    if (start_date !== undefined) updates.start_date = start_date || null;
    if (end_date !== undefined) updates.end_date = end_date || null;
    if (seats_total !== undefined) updates.seats_total = seats_total == null || seats_total === '' ? null : Number(seats_total);
    if (level !== undefined) updates.level = level || 'Beginner';
    if (status !== undefined) updates.status = status || 'Upcoming';
    if (sessions !== undefined) updates.sessions = sessions == null || sessions === '' ? 0 : Number(sessions);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

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

    return NextResponse.json({ cohort: data }, { status: 200 });
  } catch (err: unknown) {
    console.error('Error in PATCH /api/admin/cohorts/[id]:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
