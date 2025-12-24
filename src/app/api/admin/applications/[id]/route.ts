import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { attachRefresh, requireAdmin } from '@/lib/adminSession';

/**
 * Get comprehensive data for a specific application/student
 * Returns all data from applications, profiles, students, and related tables
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applicationId = params.id;

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Fetch application data
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Fetch profile data if linked
    let profile = null;
    if (application.profile_id) {
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', application.profile_id)
        .maybeSingle();
      profile = profileData;
    } else {
      // Try to find profile by email
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', application.email)
        .maybeSingle();
      profile = profileData;
    }

    // Fetch student data if exists
    let student = null;
    if (profile?.id) {
      const { data: studentData } = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle();
      student = studentData;
    }

    // Fetch cohort enrollments
    let cohortEnrollments = [];
    if (profile?.id) {
      const { data: enrollments } = await supabaseAdmin
        .from('cohort_enrollment')
        .select(`
          *,
          cohorts (
            id,
            name,
            start_date,
            end_date,
            status,
            level
          )
        `)
        .eq('student_id', profile.id);
      cohortEnrollments = enrollments || [];
    }

    // Fetch chapter progress
    let chapterProgress = [];
    if (student?.id) {
      const { data: progress } = await supabaseAdmin
        .from('chapter_progress')
        .select('*')
        .eq('student_id', student.id)
        .order('chapter_number', { ascending: true });
      chapterProgress = progress || [];
    }

    // Fetch attendance records
    let attendance = [];
    if (student?.id) {
      const { data: attendanceData } = await supabaseAdmin
        .from('attendance')
        .select(`
          *,
          events (
            id,
            name,
            type,
            start_time,
            end_time
          )
        `)
        .eq('student_id', student.id)
        .order('join_time', { ascending: false });
      attendance = attendanceData || [];
    }

    // Fetch sats rewards
    let satsRewards = [];
    if (student?.id) {
      const { data: rewards } = await supabaseAdmin
        .from('sats_rewards')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });
      satsRewards = rewards || [];
    }

    // Fetch achievements
    let achievements = [];
    if (profile?.id) {
      const { data: achievementsData } = await supabaseAdmin
        .from('achievements')
        .select('*')
        .eq('student_id', profile.id)
        .order('earned_at', { ascending: false });
      achievements = achievementsData || [];
    }

    // Fetch preferred cohort info
    let preferredCohort = null;
    if (application.preferred_cohort_id) {
      const { data: cohortData } = await supabaseAdmin
        .from('cohorts')
        .select('*')
        .eq('id', application.preferred_cohort_id)
        .maybeSingle();
      preferredCohort = cohortData;
    }

    const res = NextResponse.json(
      {
        application,
        profile,
        student,
        preferredCohort,
        cohortEnrollments,
        chapterProgress,
        attendance,
        satsRewards,
        achievements,
      },
      { status: 200 }
    );
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('Error fetching application details:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}

