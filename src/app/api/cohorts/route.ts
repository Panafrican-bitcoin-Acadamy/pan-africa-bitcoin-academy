import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, attachRefresh } from '@/lib/adminSession';
import { generateCohortSessions, validateCohortDates } from '@/lib/sessionGenerator';

export async function GET() {
  try {
    // Fetch cohorts with enrollment counts
    const { data: cohorts, error: cohortsError } = await supabase
      .from('cohorts')
      .select('*')
      .order('start_date', { ascending: true });

    if (cohortsError) {
      console.error('Error fetching cohorts:', cohortsError);
      return NextResponse.json(
        { error: 'Failed to fetch cohorts', details: cohortsError.message },
        { status: 500 }
      );
    }

    // Base seat counts on applications per cohort: approved + pending for that cohort.
    // Use admin client so RLS cannot hide rows.
    const cohortsWithSeats = await Promise.all(
      (cohorts || []).map(async (cohort: any) => {
        // Count applications for this cohort: Approved and Pending (source of truth for "taken" seats)
        const [
          { count: approvedCount, error: approvedError },
          { count: pendingCount, error: pendingError },
          { count: enrolledCount, error: enrolledError },
        ] = await Promise.all([
          supabaseAdmin
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('preferred_cohort_id', cohort.id)
            .eq('status', 'Approved'),
          supabaseAdmin
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('preferred_cohort_id', cohort.id)
            .eq('status', 'Pending'),
          supabaseAdmin
            .from('cohort_enrollment')
            .select('*', { count: 'exact', head: true })
            .eq('cohort_id', cohort.id),
        ]);

        if (approvedError) console.error(`Error counting approved for cohort ${cohort.id}:`, approvedError);
        if (pendingError) console.error(`Error counting pending for cohort ${cohort.id}:`, pendingError);
        if (enrolledError) console.error(`Error counting enrollment for cohort ${cohort.id}:`, enrolledError);

        const approvedForCohort = approvedCount ?? 0;
        const pendingApplications = pendingCount ?? 0;
        const enrolled = enrolledCount ?? 0;

        // Available = total seats minus (approved + pending) for this cohort
        const takenByApplications = approvedForCohort + pendingApplications;
        const available = Math.max(0, (cohort.seats_total || 0) - takenByApplications);

        // Get sessions count from cohorts.sessions column
        const sessions = cohort.sessions || 0;

        return {
          id: cohort.id,
          name: cohort.name || 'Unnamed Cohort',
          startDate: cohort.start_date || null,
          endDate: cohort.end_date || null,
          status: cohort.status || 'Upcoming',
          sessions: sessions, // From cohorts.sessions column
          level: cohort.level || 'Beginner',
          seats: cohort.seats_total || 0,
          available: available,
          enrolled: enrolled,
        };
      })
    );

    return NextResponse.json({ cohorts: cohortsWithSeats }, { status: 200 });
  } catch (error: any) {
    console.error('Error in cohorts API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, start_date, end_date, seats_total, level, status, sessions } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('cohorts')
      .insert({
        name: name.trim(),
        start_date: start_date || null,
        end_date: end_date || null,
        seats_total: seats_total ?? null,
        level: level || 'Beginner',
        status: status || 'Upcoming',
        sessions: sessions ?? 0,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating cohort:', error);
      return NextResponse.json(
        { 
          error: 'Failed to create cohort',
          ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
        },
        { status: 500 }
      );
    }

    // Auto-generate sessions if start_date and end_date are provided
    if (data && start_date && end_date) {
      const validation = validateCohortDates(start_date, end_date);
      if (validation.valid) {
        try {
          const sessionDates = generateCohortSessions(
            new Date(start_date),
            new Date(end_date)
          );

          if (sessionDates.length > 0) {
            const sessionsToInsert = sessionDates.map(({ date, sessionNumber }) => ({
              cohort_id: data.id,
              session_date: date.toISOString().split('T')[0],
              session_number: sessionNumber,
              status: 'scheduled',
            }));

            await supabaseAdmin
              .from('cohort_sessions')
              .insert(sessionsToInsert);

            // Update sessions count
            await supabaseAdmin
              .from('cohorts')
              .update({ sessions: sessionDates.length })
              .eq('id', data.id);

            // Update data object with session count
            data.sessions = sessionDates.length;
          }
        } catch (sessionError: any) {
          console.error('Error generating sessions:', sessionError);
          // Don't fail cohort creation if session generation fails
        }
      }
    }

    const res = NextResponse.json({ success: true, cohort: data }, { status: 200 });
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('Error in create cohort API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}

