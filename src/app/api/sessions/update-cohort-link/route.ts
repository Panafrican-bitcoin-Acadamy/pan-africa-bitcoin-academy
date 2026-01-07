import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * Update all sessions for a cohort with a video call link
 * POST /api/sessions/update-cohort-link
 * Body: { cohortName: string, link: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { cohortName, link } = body;

    if (!cohortName || !link) {
      return NextResponse.json(
        { error: 'cohortName and link are required' },
        { status: 400 }
      );
    }

    // Find the cohort by name
    const { data: cohort, error: cohortError } = await supabaseAdmin
      .from('cohorts')
      .select('id, name')
      .eq('name', cohortName)
      .maybeSingle();

    if (cohortError) {
      console.error('Error fetching cohort:', cohortError);
      return NextResponse.json(
        { error: 'Failed to fetch cohort', details: cohortError.message },
        { status: 500 }
      );
    }

    if (!cohort) {
      return NextResponse.json(
        { error: `Cohort "${cohortName}" not found` },
        { status: 404 }
      );
    }

    // Update all sessions for this cohort
    const { data: updatedSessions, error: updateError } = await supabaseAdmin
      .from('cohort_sessions')
      .update({ link })
      .eq('cohort_id', cohort.id)
      .select('id, session_number');

    if (updateError) {
      console.error('Error updating sessions:', updateError);
      return NextResponse.json(
        { error: 'Failed to update sessions', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedSessions?.length || 0} sessions for ${cohortName}`,
      cohortId: cohort.id,
      sessionsUpdated: updatedSessions?.length || 0,
    });
  } catch (error: any) {
    console.error('Error in update-cohort-link API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}



