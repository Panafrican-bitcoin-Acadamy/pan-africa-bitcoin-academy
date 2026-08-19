import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';
import { ensureBuiltInAssignments } from '@/lib/builtInAssignments';

/**
 * GET /api/admin/assignments
 * Get all assignments
 */
export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureBuiltInAssignments(supabaseAdmin);

    const { data: assignments, error } = await supabaseAdmin
      .from('assignments')
      .select(`
        *,
        cohorts:cohort_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin Assignments API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch assignments', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ assignments: assignments || [] }, { status: 200 });
  } catch (error: unknown) {
    console.error('[Admin Assignments API] Error:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details },
      { status: 500 }
    );
  }
}

