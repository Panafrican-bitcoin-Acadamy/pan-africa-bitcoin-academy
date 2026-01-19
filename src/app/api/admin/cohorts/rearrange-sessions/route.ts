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
    // - Use only 3 working days per week: Monday, Wednesday, Friday
    // - Sundays must never be used
    // - Keep all sessions, only reschedule them
    // - Start from Session 1 date (Jan 19, 2026)
    // - Fixed dates: Session 4 = Jan 26, Session 6 = Jan 30, Session 8 = Feb 4
    
    const sessionUpdates: Array<{ id: string; session_date: string; session_number: number }> = [];
    
    // Fixed dates for specific sessions (must match exactly)
    const fixedDates: Record<number, string> = {
      4: '2026-01-26', // Monday
      6: '2026-01-30', // Friday
      8: '2026-02-04', // Wednesday
    };

    // Define the 3-day pattern: Monday (1), Wednesday (3), Friday (5)
    const workingDays = [1, 3, 5]; // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday

    // Helper function to get next working day in pattern
    function getNextWorkingDay(current: Date, currentPatternIndex: number): { date: Date; patternIndex: number } {
      // Move to next day in pattern: Mon -> Wed -> Fri -> Mon (next week)
      const nextPatternIndex = (currentPatternIndex + 1) % 3;
      const targetDay = workingDays[nextPatternIndex];
      const currentDay = current.getDay();
      
      let nextDate = new Date(current);
      
      if (currentDay === targetDay) {
        // Already on target day, move to next week's same day
        nextDate.setDate(nextDate.getDate() + 7);
      } else {
        // Calculate days to next occurrence of target day
        let days = (targetDay - currentDay + 7) % 7;
        if (days === 0) {
          days = 7; // Next week
        }
        nextDate.setDate(nextDate.getDate() + days);
      }
      
      // Ensure we never land on Sunday
      if (nextDate.getDay() === 0) {
        nextDate.setDate(nextDate.getDate() + 1); // Move to Monday
        return { date: nextDate, patternIndex: 0 };
      }
      
      return { date: nextDate, patternIndex: nextPatternIndex };
    }

    // Start from Session 1 date
    let currentDate = new Date(startDateObj);
    
    // If start date is Sunday, move to Monday
    if (currentDate.getDay() === 0) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // If start date is not a working day (Mon/Wed/Fri), move to the next working day
    while (!workingDays.includes(currentDate.getDay())) {
      currentDate.setDate(currentDate.getDate() + 1);
      // Skip Sunday if we hit it
      if (currentDate.getDay() === 0) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Track which day in the pattern we're on (0=Mon, 1=Wed, 2=Fri)
    let patternIndex = workingDays.indexOf(currentDate.getDay());

    for (const session of sessions) {
      let dateString: string;
      
      // Check if this session has a fixed date requirement
      if (fixedDates[session.session_number]) {
        // Use the exact fixed date
        dateString = fixedDates[session.session_number];
        // Update currentDate and patternIndex to continue from this fixed date
        currentDate = new Date(dateString);
        patternIndex = workingDays.indexOf(currentDate.getDay());
        // Move to next working day in pattern for next session
        const next = getNextWorkingDay(currentDate, patternIndex);
        currentDate = next.date;
        patternIndex = next.patternIndex;
      } else {
        // For sessions without fixed dates, use the 3-day pattern (Mon, Wed, Fri)
        // Ensure we're on a working day
        while (currentDate.getDay() === 0 || !workingDays.includes(currentDate.getDay())) {
          if (currentDate.getDay() === 0) {
            // Skip Sunday, move to Monday
            currentDate.setDate(currentDate.getDate() + 1);
            patternIndex = 0; // Reset to Monday
          } else {
            // Not a working day, move to next working day in pattern
            const next = getNextWorkingDay(currentDate, patternIndex);
            currentDate = next.date;
            patternIndex = next.patternIndex;
          }
        }
        
        dateString = currentDate.toISOString().split('T')[0];
        
        // Move to next working day in pattern for next session
        const next = getNextWorkingDay(currentDate, patternIndex);
        currentDate = next.date;
        patternIndex = next.patternIndex;
      }

      sessionUpdates.push({
        id: session.id,
        session_date: dateString,
        session_number: session.session_number,
      });
    }
    
    // Log the schedule for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Session rearrangement schedule (3 days/week: Mon, Wed, Fri):');
      sessionUpdates.forEach(update => {
        const date = new Date(update.session_date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
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

    // Prepare schedule details for response
    const scheduleDetails = sessionUpdates.map(update => {
      const date = new Date(update.session_date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      return {
        session_number: update.session_number,
        date: update.session_date,
        day: dayName,
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: `Successfully rearranged ${sessionUpdates.length} sessions for ${cohort.name}`,
        sessionsUpdated: sessionUpdates.length,
        startDate: startDate,
        endDate: sessionUpdates[sessionUpdates.length - 1]?.session_date,
        schedule: scheduleDetails, // Include full schedule in response
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

