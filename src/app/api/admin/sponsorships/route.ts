import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/sponsorships
 * Get all sponsorships with student information
 */
export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: sponsorships, error } = await supabaseAdmin
      .from('sponsorships')
      .select(`
        *,
        profiles:student_id (
          id,
          name,
          email,
          student_id
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin Sponsorships API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sponsorships', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ sponsorships: sponsorships || [] }, { status: 200 });
  } catch (error: any) {
    console.error('[Admin Sponsorships API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

