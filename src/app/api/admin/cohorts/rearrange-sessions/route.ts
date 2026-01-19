import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * Rearrange all sessions for a cohort
 * POST /api/admin/cohorts/rearrange-sessions
 * Body: { cohortId: string, startDate: string (YYYY-MM-DD) }
 * 
 * This will:
 * 1. Get all sessions for the cohort, ordered by session_number
 * 2. Start from the provided startDate (session 1)
 * 3. Assign dates with 1 day difference, skipping Sundays
 * 4. Update all sessions
 */
export async function POST(req: NextRequest) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { cohortId, cohortName, startDate } = body;

    if (!startDate) {
      return NextResponse.json(
        { error: 'startDate is required' },
        { status: 400 }
      );
    }

    if (!cohortId && !cohortName) {
      return NextResponse.json(
        { error: 'Either cohortId or cohortName is required' },
        { status: 400 }
      );
    }

    // Validate date format
    const startDateObj = new Date(startDate);
    if (isNaN(startDateObj.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Find cohort by ID or name
    let cohortQuery = supabaseAdmin
      .from('cohorts')
      .select('id, name');

    if (cohortId) {
      cohortQuery = cohortQuery.eq('id', cohortId);
    } else if (cohortName) {
      cohortQuery = cohortQuery.eq('name', cohortName);
    }

    const { data: cohort, error: cohortError } = await cohortQuery.single();

    if (cohortError || !cohort) {
      return NextResponse.json(
        { error: `Cohort not found${cohortName ? `: "${cohortName}"` : ''}` },
        { status: 404 }
      );
    }

    const finalCohortId = cohort.id;

    // Get all sessions for this cohort, ordered by session_number
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('cohort_sessions')
      .select('id, session_number')
      .eq('cohort_id', finalCohortId)
      .order('session_number', { ascending: true });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch sessions', details: sessionsError.message },
        { status: 500 }
      );
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json(
        { error: 'No sessions found for this cohort' },
        { status: 404 }
      );
    }

    // Calculate dates for each session
    // Requirements:
    // - Session 1: Jan 19, 2026 (Monday) - startDate
    // - Session 4: Jan 26, 2026 (Monday) - MUST BE THIS DATE
    // - Session 6: Jan 30, 2026 (Friday) - MUST BE THIS DATE  
    // - Session 8: Feb 4, 2026 (Wednesday) - MUST BE THIS DATE
    // - Sundays must be empty (skipped)
    // - Fill in other sessions with 1 day spacing, skipping Sundays
    
    const sessionUpdates: Array<{ id: string; session_date: string; session_number: number }> = [];
    
    // Fixed dates for specific sessions (must match exactly)
    const fixedDates: Record<number, string> = {
      4: '2026-01-26',
      6: '2026-01-30',
      8: '2026-02-04',
    };

    // Start from Session 1 date
    let currentDate = new Date(startDateObj);
    
    // If start date is Sunday, move to Monday
    if (currentDate.getDay() === 0) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    for (const session of sessions) {
      let dateString: string;
      
      // Check if this session has a fixed date requirement
      if (fixedDates[session.session_number]) {
        // Use the exact fixed date
        dateString = fixedDates[session.session_number];
        // Set currentDate to the day after this fixed date for next iteration
        currentDate = new Date(dateString);
        currentDate.setDate(currentDate.getDate() + 1);
      } else {
        // For sessions without fixed dates, use 1 day spacing, skipping Sundays
        // Skip Sundays
        while (currentDate.getDay() === 0) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        dateString = currentDate.toISOString().split('T')[0];
        // Move to next day for next session
        currentDate.setDate(currentDate.getDate() + 1);
      }

      sessionUpdates.push({
        id: session.id,
        session_date: dateString,
        session_number: session.session_number,
      });
    }
    
    // Log the schedule for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Session rearrangement schedule:');
      sessionUpdates.forEach(update => {
        const date = new Date(update.session_date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        console.log(`  Session ${update.session_number}: ${update.session_date} (${dayName})`);
      });
    }

    // Update all sessions in a transaction-like manner
    // We'll use Promise.all to update all sessions
    const updatePromises = sessionUpdates.map((update) =>
      supabaseAdmin
        .from('cohort_sessions')
        .update({ session_date: update.session_date })
        .eq('id', update.id)
    );

    const results = await Promise.allSettled(updatePromises);
    
    // Check for failures
    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length > 0) {
      console.error('Some sessions failed to update:', failures);
      return NextResponse.json(
        {
          error: `Failed to update ${failures.length} session(s)`,
          details: failures.map((f: any) => f.reason?.message || 'Unknown error'),
        },
        { status: 500 }
      );
    }

    // Check for update errors
    const updateErrors = results
      .map((result, index) => {
        if (result.status === 'fulfilled' && result.value.error) {
          return { index, error: result.value.error };
        }
        return null;
      })
      .filter(Boolean);

    if (updateErrors.length > 0) {
      console.error('Update errors:', updateErrors);
      return NextResponse.json(
        {
          error: `Failed to update ${updateErrors.length} session(s)`,
          details: updateErrors.map((e: any) => e.error?.message || 'Unknown error'),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully rearranged ${sessionUpdates.length} sessions for ${cohort.name}`,
        sessionsUpdated: sessionUpdates.length,
        startDate: startDate,
        endDate: sessionUpdates[sessionUpdates.length - 1]?.session_date,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in rearrange-sessions API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}

