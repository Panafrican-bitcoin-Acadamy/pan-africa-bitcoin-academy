import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, attachRefresh } from '@/lib/adminSession';
import { generateCohortSessions, validateCohortDates } from '@/lib/sessionGenerator';

/**
 * Generate sessions for all cohorts that have start/end dates but no sessions
 * POST /api/cohorts/generate-all-sessions
 */
export async function POST(req: NextRequest) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all cohorts with start/end dates
    const { data: cohorts, error: cohortsError } = await supabaseAdmin
      .from('cohorts')
      .select('id, name, start_date, end_date')
      .not('start_date', 'is', null)
      .not('end_date', 'is', null);

    if (cohortsError) {
      return NextResponse.json(
        { error: 'Failed to fetch cohorts', details: cohortsError.message },
        { status: 500 }
      );
    }

    if (!cohorts || cohorts.length === 0) {
      return NextResponse.json(
        { message: 'No cohorts found with start and end dates', processed: 0 },
        { status: 200 }
      );
    }

    const results: Array<{ cohortId: string; cohortName: string; sessionsGenerated: number; error?: string }> = [];

    for (const cohort of cohorts) {
      try {
        // Validate dates
        const validation = validateCohortDates(cohort.start_date, cohort.end_date);
        if (!validation.valid) {
          results.push({
            cohortId: cohort.id,
            cohortName: cohort.name,
            sessionsGenerated: 0,
            error: validation.error,
          });
          continue;
        }

        // Generate session dates
        const sessionDates = generateCohortSessions(
          new Date(cohort.start_date),
          new Date(cohort.end_date)
        );

        if (sessionDates.length === 0) {
          results.push({
            cohortId: cohort.id,
            cohortName: cohort.name,
            sessionsGenerated: 0,
            error: 'No valid session dates could be generated',
          });
          continue;
        }

        // Delete existing sessions for this cohort
        await supabaseAdmin
          .from('cohort_sessions')
          .delete()
          .eq('cohort_id', cohort.id);

        // Insert new sessions
        const sessionsToInsert = sessionDates.map(({ date, sessionNumber }) => ({
          cohort_id: cohort.id,
          session_date: date.toISOString().split('T')[0],
          session_number: sessionNumber,
          status: 'scheduled',
        }));

        const { error: insertError } = await supabaseAdmin
          .from('cohort_sessions')
          .insert(sessionsToInsert);

        if (insertError) {
          results.push({
            cohortId: cohort.id,
            cohortName: cohort.name,
            sessionsGenerated: 0,
            error: insertError.message,
          });
          continue;
        }

        // Update cohort sessions count
        await supabaseAdmin
          .from('cohorts')
          .update({ sessions: sessionDates.length })
          .eq('id', cohort.id);

        results.push({
          cohortId: cohort.id,
          cohortName: cohort.name,
          sessionsGenerated: sessionDates.length,
        });
      } catch (error: any) {
        results.push({
          cohortId: cohort.id,
          cohortName: cohort.name,
          sessionsGenerated: 0,
          error: error.message || 'Unknown error',
        });
      }
    }

    const totalSessions = results.reduce((sum, r) => sum + r.sessionsGenerated, 0);
    const successful = results.filter((r) => r.sessionsGenerated > 0).length;
    const failed = results.filter((r) => r.error).length;

    const res = NextResponse.json(
      {
        success: true,
        totalCohorts: cohorts.length,
        successful,
        failed,
        totalSessionsGenerated: totalSessions,
        results,
      },
      { status: 200 }
    );
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('Error generating sessions for all cohorts:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}
