import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(_req: NextRequest) {
  try {
    // 1. Total Students Trained (count approved applications)
    const { count: totalStudentsTrained, error: applicationsError } = await supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Approved');

    if (applicationsError) {
      console.error('Error fetching approved applications:', applicationsError);
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

    // 5. Teaching Hours (1 hour per completed cohort session)
    const { count: completedSessionsCount, error: sessionsError } = await supabaseAdmin
      .from('cohort_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    let teachingHours = 0;
    if (!sessionsError && completedSessionsCount != null) {
      teachingHours = completedSessionsCount; // 1 teaching hour per completed session
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

