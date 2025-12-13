import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(_req: NextRequest) {
  try {
    // Fetch completed cohorts with enrollment data
    const { data: cohorts, error: cohortsError } = await supabaseAdmin
      .from('cohorts')
      .select('*')
      .eq('status', 'Completed')
      .order('end_date', { ascending: false });

    if (cohortsError) {
      console.error('Error fetching cohorts:', cohortsError);
      return NextResponse.json(
        {
          error: 'Failed to fetch cohorts',
          ...(process.env.NODE_ENV === 'development' ? { details: cohortsError.message } : {})
        },
        { status: 500 }
      );
    }

    // For each cohort, get enrollment and completion statistics
    const cohortsWithStats = await Promise.all(
      (cohorts || []).map(async (cohort: any) => {
        // Count enrolled students
        const { count: enrolledCount, error: enrollmentError } = await supabaseAdmin
          .from('cohort_enrollment')
          .select('*', { count: 'exact', head: true })
          .eq('cohort_id', cohort.id);

        if (enrollmentError) {
          console.error(`Error fetching enrollment for cohort ${cohort.id}:`, enrollmentError);
        }

        // Get enrolled student IDs
        const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
          .from('cohort_enrollment')
          .select('student_id')
          .eq('cohort_id', cohort.id);

        const studentIds = enrollments?.map((e: any) => e.student_id) || [];

        // Calculate completion rate (students with status = 'Graduated')
        let completionRate = 0;
        if (studentIds.length > 0) {
          const { count: graduatedCount, error: graduatedError } = await supabaseAdmin
            .from('students')
            .select('*', { count: 'exact', head: true })
            .in('profile_id', studentIds)
            .eq('status', 'Graduated');

          if (!graduatedError && enrolledCount && enrolledCount > 0) {
            completionRate = Math.round(((graduatedCount || 0) / enrolledCount) * 100);
          }
        }

        // Get mentor information (if available in events or we can add it later)
        // For now, we'll leave it empty or try to get from events
        let mentor = null;
        try {
          const { data: cohortEvents, error: eventsError } = await supabaseAdmin
            .from('events')
            .select('description')
            .eq('cohort_id', cohort.id)
            .eq('type', 'live-class')
            .limit(1);

          // Mentor info might be in description or we can add a mentor field to cohorts later
          // For now, we'll return null
        } catch (e) {
          // Ignore errors for mentor lookup
        }

        // Format dates
        const formatDate = (dateStr: string | null) => {
          if (!dateStr) return null;
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        };

        return {
          id: cohort.id,
          name: cohort.name || 'Unnamed Cohort',
          students: enrolledCount || 0,
          completionRate: completionRate,
          startDate: formatDate(cohort.start_date),
          endDate: formatDate(cohort.end_date),
          mentor: mentor || null,
          level: cohort.level || 'Beginner',
        };
      })
    );

    return NextResponse.json({ cohorts: cohortsWithStats }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching impact cohorts:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}

