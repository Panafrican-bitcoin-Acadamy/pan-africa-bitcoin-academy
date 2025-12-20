import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, attachRefresh } from '@/lib/adminSession';

/**
 * Get sessions for a student (filtered by their enrolled cohorts)
 * GET /api/sessions?email=student@example.com
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const cohortId = searchParams.get('cohortId');
    const isAdmin = searchParams.get('admin') === 'true';

    // Admin can see all sessions
    if (isAdmin) {
      const session = requireAdmin(request);
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: sessions, error } = await supabaseAdmin
        .from('cohort_sessions')
        .select(`
          *,
          cohorts (
            id,
            name,
            level,
            status
          )
        `)
        .order('session_date', { ascending: true })
        .order('session_number', { ascending: true });

      if (error) {
        console.error('Error fetching sessions:', error);
        return NextResponse.json(
          { error: 'Failed to fetch sessions', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ sessions: sessions || [] }, { status: 200 });
    }

    // Student: fetch sessions for their enrolled cohorts only
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required for student access' },
        { status: 400 }
      );
    }

    // Get student's profile to find enrolled cohorts
    // Use supabaseAdmin to bypass RLS and ensure we can find the profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile', details: profileError.message },
        { status: 500 }
      );
    }

    if (!profile) {
      console.log(`Profile not found for email: ${email}`);
      return NextResponse.json(
        { error: 'Student not found', sessions: [] },
        { status: 404 }
      );
    }

    console.log(`Found profile for ${email}:`, profile.id);

    // Get enrolled cohort IDs
    const { data: enrollments, error: enrollmentError } = await supabaseAdmin
      .from('cohort_enrollment')
      .select('cohort_id')
      .eq('student_id', profile.id);

    if (enrollmentError) {
      console.error('Error fetching enrollments:', enrollmentError);
      return NextResponse.json(
        { error: 'Failed to fetch enrollments', details: enrollmentError.message },
        { status: 500 }
      );
    }

    console.log(`Found ${enrollments?.length || 0} enrollments for profile ${profile.id}`);

    if (!enrollments || enrollments.length === 0) {
      console.log(`No enrollments found for student ${profile.id}`);
      return NextResponse.json({ sessions: [] }, { status: 200 });
    }

    const cohortIds = enrollments.map((e) => e.cohort_id);
    console.log(`Fetching sessions for cohorts:`, cohortIds);

    // Fetch sessions for enrolled cohorts
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('cohort_sessions')
      .select(`
        *,
        cohorts (
          id,
          name,
          level,
          status
        )
      `)
      .in('cohort_id', cohortIds)
      .order('session_date', { ascending: true })
      .order('session_number', { ascending: true });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch sessions', details: sessionsError.message },
        { status: 500 }
      );
    }

    console.log(`Found ${sessions?.length || 0} sessions for student ${profile.id}`);

    return NextResponse.json({ sessions: sessions || [] }, { status: 200 });
  } catch (error: any) {
    console.error('Error in sessions API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}
