import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, attachRefresh } from '@/lib/adminSession';
import { generateCohortSessions, validateCohortDates } from '@/lib/sessionGenerator';

export async function GET() {
  try {
    // Fetch cohorts with enrollment counts (use admin client so RLS cannot block)
    const { data: cohorts, error: cohortsError } = await supabaseAdmin
      .from('cohorts')
      .select('*')
      .order('start_date', { ascending: true });

    if (cohortsError) {
      console.error('Error fetching cohorts:', cohortsError);
      return NextResponse.json(
        {
          error: 'Failed to fetch cohorts',
          ...(process.env.NODE_ENV === 'development' ? { details: cohortsError.message } : {}),
        },
        { status: 500 }
      );
    }

    // Base seat counts on applications per cohort: approved + pending for that cohort.
    const cohortsWithSeats = await Promise.all(
      (cohorts || []).map(async (cohort: any) => {
        try {
          const cohortId = cohort?.id;
          if (!cohortId) {
            return {
              id: cohort?.id ?? '',
              name: cohort?.name || 'Unnamed Cohort',
              startDate: cohort?.start_date || null,
              endDate: cohort?.end_date || null,
              status: cohort?.status || 'Upcoming',
              sessions: cohort?.sessions || 0,
              level: cohort?.level || 'Beginner',
              seats: cohort?.seats_total || 0,
              available: cohort?.seats_total || 0,
              enrolled: 0,
            };
          }

          let pendingCount = 0;
          let enrollmentCount = 0;

          try {
            const [pendingRes, enrolledRes, profileRes] = await Promise.all([
              supabaseAdmin
                .from('applications')
                .select('*', { count: 'exact', head: true })
                .eq('preferred_cohort_id', cohortId)
                .eq('status', 'Pending'),
              supabaseAdmin
                .from('cohort_enrollment')
                .select('student_id', { count: 'exact', head: false })
                .eq('cohort_id', cohortId),
              supabaseAdmin
                .from('profiles')
                .select('id', { count: 'exact', head: false })
                .eq('cohort_id', cohortId),
            ]);
            pendingCount = pendingRes.count ?? 0;

            const enrollmentIds = new Set((enrolledRes.data || []).map((r: any) => r.student_id));
            const profileIds = new Set((profileRes.data || []).map((r: any) => r.id));
            const mergedIds = new Set([...enrollmentIds, ...profileIds]);
            enrollmentCount = mergedIds.size;

            if (pendingRes.error) console.error(`Error counting pending for cohort ${cohortId}:`, pendingRes.error);
            if (enrolledRes.error) console.error(`Error counting enrollment for cohort ${cohortId}:`, enrolledRes.error);
            if (profileRes.error) console.error(`Error counting profiles for cohort ${cohortId}:`, profileRes.error);
          } catch (countErr) {
            console.error(`Error counting seats for cohort ${cohortId}:`, countErr);
          }

          const takenByApplications = enrollmentCount + pendingCount;
          const available = Math.max(0, (cohort.seats_total || 0) - takenByApplications);

          return {
            id: cohort.id,
            name: cohort.name || 'Unnamed Cohort',
            startDate: cohort.start_date || null,
            endDate: cohort.end_date || null,
            status: cohort.status || 'Upcoming',
            sessions: cohort.sessions || 0,
            level: cohort.level || 'Beginner',
            seats: cohort.seats_total || 0,
            available,
            enrolled: enrollmentCount,
          };
        } catch (rowErr) {
          console.error(`Error processing cohort ${cohort?.id}:`, rowErr);
          return {
            id: cohort?.id ?? '',
            name: cohort?.name || 'Unnamed Cohort',
            startDate: cohort?.start_date || null,
            endDate: cohort?.end_date || null,
            status: cohort?.status || 'Upcoming',
            sessions: cohort?.sessions || 0,
            level: cohort?.level || 'Beginner',
            seats: cohort?.seats_total || 0,
            available: cohort?.seats_total || 0,
            enrolled: 0,
          };
        }
      })
    );

    // Prevent caching so apply page always gets fresh seat counts after approvals
    const res = NextResponse.json({ cohorts: cohortsWithSeats }, { status: 200 });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res;
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

    const { name, start_date, end_date, seats_total, level, status, sessions, session_duration_minutes } = await req.json();

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
            const durationMins = session_duration_minutes != null && session_duration_minutes !== '' ? Number(session_duration_minutes) : 90;
            const sessionsToInsert = sessionDates.map(({ date, sessionNumber }) => ({
              cohort_id: data.id,
              session_date: date.toISOString().split('T')[0],
              session_number: sessionNumber,
              status: 'scheduled',
              duration_minutes: durationMins,
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

