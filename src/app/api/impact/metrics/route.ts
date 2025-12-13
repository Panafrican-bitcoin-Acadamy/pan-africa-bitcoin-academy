import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(_req: NextRequest) {
  try {
    // 1. Total Students Trained (status = 'Graduated')
    const { count: totalStudentsTrained, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Graduated');

    if (studentsError) {
      console.error('Error fetching graduated students:', studentsError);
    }

    // 2. Cohorts Completed (status = 'Completed')
    const { count: cohortsCompleted, error: cohortsError } = await supabaseAdmin
      .from('cohorts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Completed');

    if (cohortsError) {
      console.error('Error fetching completed cohorts:', cohortsError);
    }

    // 3. Countries Reached (distinct countries from students)
    const { data: studentsData, error: countriesError } = await supabaseAdmin
      .from('students')
      .select('country');

    let countriesReached = 0;
    if (!countriesError && studentsData) {
      // Get distinct countries (filter out null/empty values)
      const distinctCountries = new Set(
        studentsData
          .map((s) => s.country)
          .filter((c) => c && c.trim() !== '')
      );
      countriesReached = distinctCountries.size;
    }

    // 4. Assignments Submitted (sum of assignments_completed from students)
    const { data: allStudents, error: assignmentsError } = await supabaseAdmin
      .from('students')
      .select('assignments_completed');

    let assignmentsSubmitted = 0;
    if (!assignmentsError && allStudents) {
      assignmentsSubmitted = allStudents.reduce(
        (sum, student) => sum + (student.assignments_completed || 0),
        0
      );
    }

    // 5. Teaching Hours (sum of live-class event durations)
    const { data: liveClassEvents, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('start_time, end_time')
      .eq('type', 'live-class')
      .not('start_time', 'is', null)
      .not('end_time', 'is', null);

    let teachingHours = 0;
    if (!eventsError && liveClassEvents) {
      // Calculate total hours from event durations
      const totalMs = liveClassEvents.reduce((total, event) => {
        if (event.start_time && event.end_time) {
          const start = new Date(event.start_time);
          const end = new Date(event.end_time);
          const durationMs = end.getTime() - start.getTime();
          return total + Math.max(0, durationMs); // Only positive durations
        }
        return total;
      }, 0);
      
      // Convert milliseconds to hours (round to 1 decimal place)
      teachingHours = Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10;
    }

    return NextResponse.json(
      {
        totalStudentsTrained: totalStudentsTrained || 0,
        cohortsCompleted: cohortsCompleted || 0,
        countriesReached: countriesReached || 0,
        assignmentsSubmitted: assignmentsSubmitted || 0,
        teachingHours: teachingHours || 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching impact metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch impact metrics',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}

