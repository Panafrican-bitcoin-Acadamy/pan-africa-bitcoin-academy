import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/session';

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

    // For each cohort, count enrolled students
    const cohortsWithSeats = await Promise.all(
      (cohorts || []).map(async (cohort: any) => {
        const { count, error: countError } = await supabase
          .from('cohort_enrollment')
          .select('*', { count: 'exact', head: true })
          .eq('cohort_id', cohort.id);

        const enrolled = count || 0;
        const available = Math.max(0, (cohort.seats_total || 0) - enrolled);

        return {
          id: cohort.id,
          name: cohort.name || 'Unnamed Cohort',
          startDate: cohort.start_date || null,
          endDate: cohort.end_date || null,
          status: cohort.status || 'Upcoming',
          sessions: cohort.sessions || 0,
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
      { error: 'Internal server error', details: error.message },
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
        { error: 'Failed to create cohort', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, cohort: data }, { status: 200 });
  } catch (error: any) {
    console.error('Error in create cohort API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

