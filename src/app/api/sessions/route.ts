import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, attachRefresh } from '@/lib/adminSession';

/**
 * Get sessions for a student (filtered by their enrolled cohorts)
 * GET /api/sessions?studentId=uuid OR ?cohortId=uuid OR ?email=student@example.com OR ?admin=true
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    const cohortId = searchParams.get('cohortId');
    const email = searchParams.get('email');
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

    // Student: fetch sessions for their enrolled cohorts
    // Priority: studentId > cohortId > email
    let profileIdToUse: string | null = null;

    if (studentId) {
      // Direct student ID lookup - most reliable
      console.log(`📅 Sessions API: Using studentId: ${studentId}`);
      profileIdToUse = studentId;
    } else if (cohortId) {
      // Direct cohort lookup - fetch sessions for this specific cohort
      console.log(`📅 Sessions API: Fetching sessions directly for cohort: ${cohortId}`);
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
        .eq('cohort_id', cohortId)
        .order('session_date', { ascending: true })
        .order('session_number', { ascending: true });

      if (sessionsError) {
        console.error('Error fetching sessions by cohortId:', sessionsError);
        return NextResponse.json(
          { error: 'Failed to fetch sessions', details: sessionsError.message },
          { status: 500 }
        );
      }

      console.log(`📅 Sessions API: Found ${sessions?.length || 0} sessions for cohort ${cohortId}`);
      return NextResponse.json({ sessions: sessions || [] }, { status: 200 });
    } else if (email) {
      // Fallback to email-based lookup
      console.log(`📅 Sessions API: Looking up profile by email: ${email}`);
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
        console.log(`📅 Sessions API: Profile not found for email: ${email}`);
        return NextResponse.json(
          { error: 'Student not found', sessions: [] },
          { status: 404 }
        );
      }

      profileIdToUse = profile.id;
      console.log(`📅 Sessions API: Found profile for ${email}: ${profileIdToUse}`);
    } else {
      return NextResponse.json(
        { error: 'studentId, cohortId, or email is required for student access' },
        { status: 400 }
      );
    }

    // Get enrolled cohort IDs using the profile ID
    console.log(`📅 Sessions API: Fetching enrollments for student: ${profileIdToUse}`);
    const { data: enrollments, error: enrollmentError } = await supabaseAdmin
      .from('cohort_enrollment')
      .select('cohort_id')
      .eq('student_id', profileIdToUse);

    if (enrollmentError) {
      console.error('Error fetching enrollments:', enrollmentError);
      return NextResponse.json(
        { error: 'Failed to fetch enrollments', details: enrollmentError.message },
        { status: 500 }
      );
    }

    console.log(`📅 Sessions API: Found ${enrollments?.length || 0} enrollments for student ${profileIdToUse}`);

    if (!enrollments || enrollments.length === 0) {
      console.log(`📅 Sessions API: No enrollments found for student ${profileIdToUse}`);
      return NextResponse.json({ sessions: [] }, { status: 200 });
    }

    const cohortIds = enrollments.map((e) => e.cohort_id);
    console.log(`📅 Sessions API: Fetching sessions for cohorts:`, cohortIds);

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

    console.log(`📅 Sessions API: Found ${sessions?.length || 0} sessions for student ${profileIdToUse}`);

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
