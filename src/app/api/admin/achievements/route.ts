import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/achievements
 * Get all achievements with student information
 */
export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: achievements, error } = await supabaseAdmin
      .from('achievements')
      .select(`
        *,
        profiles:student_id (
          id,
          name,
          email,
          student_id,
          cohort_id,
          cohorts:cohort_id (
            id,
            name
          )
        )
      `)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('[Admin Achievements API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch achievements', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ achievements: achievements || [] }, { status: 200 });
  } catch (error: any) {
    console.error('[Admin Achievements API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

