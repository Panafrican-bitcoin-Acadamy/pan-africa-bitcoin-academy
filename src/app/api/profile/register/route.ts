import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, cohortNumber, cohortName } = await req.json();

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'firstName, lastName, and email are required' },
        { status: 400 }
      );
    }

    // Determine cohort index and year for student ID
    const cohortIdx = Number.parseInt(cohortNumber ?? '1', 10) || 1;
    const year = new Date().getFullYear();

    // Count existing registrations in this cohort to derive roll number
    let roll = 1;
    try {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('cohort_id', cohortName || `Cohort ${cohortIdx}`);

      // If cohort exists, count enrollments
      const { data: cohortData } = await supabase
        .from('cohorts')
        .select('id')
        .eq('name', cohortName || `Cohort ${cohortIdx}`)
        .limit(1)
        .single();

      if (cohortData) {
        const { count: enrollmentCount } = await supabase
          .from('cohort_enrollment')
          .select('*', { count: 'exact', head: true })
          .eq('cohort_id', cohortData.id);

        roll = (enrollmentCount || 0) + 1;
      } else {
        roll = (count || 0) + 1;
      }
    } catch {
      // fallback to roll = 1
    }

    const studentId = `${cohortIdx}/${roll}/${year}`;

    // Find or create cohort
    let cohortId = null;
    if (cohortName) {
      const { data: existingCohort } = await supabase
        .from('cohorts')
        .select('id')
        .eq('name', cohortName)
        .limit(1)
        .single();

      if (existingCohort) {
        cohortId = existingCohort.id;
      }
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, student_id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    let profile;
    if (existingProfile) {
      // Profile already exists - return success
      profile = existingProfile;
      console.log('Profile already exists, skipping creation');
    } else {
      // Create profile
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          name: `${firstName} ${lastName}`.trim(),
          email: email.toLowerCase().trim(),
          student_id: studentId,
          status: 'New',
          cohort_id: cohortId,
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return NextResponse.json(
          { error: 'Failed to create profile', details: profileError.message },
          { status: 500 }
        );
      }
      profile = newProfile;
    }

    // Check if student record already exists, if not create it
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (!existingStudent) {
      // Create student record (non-blocking - if it fails, profile is still created)
      const { error: studentError } = await supabase.from('students').insert({
        profile_id: profile.id,
        progress_percent: 0,
        assignments_completed: 0,
        projects_completed: 0,
        live_sessions_attended: 0,
      });

      if (studentError) {
        console.warn('Warning: Failed to create student record:', studentError);
        // Continue anyway - profile was created successfully
      }
    }

    // If cohort exists, enroll the student (non-blocking, idempotent)
    if (cohortId) {
      // Check if enrollment already exists
      const { data: existingEnrollment } = await supabase
        .from('cohort_enrollment')
        .select('id')
        .eq('cohort_id', cohortId)
        .eq('student_id', profile.id)
        .maybeSingle();

      if (!existingEnrollment) {
        const { error: enrollmentError } = await supabase.from('cohort_enrollment').insert({
          cohort_id: cohortId,
          student_id: profile.id,
        });

        if (enrollmentError) {
          console.warn('Warning: Failed to create cohort enrollment:', enrollmentError);
          // Continue anyway - profile was created successfully
        }
      }
    }

    // Return success - profile was created successfully
    return NextResponse.json(
      { success: true, profileId: profile.id, studentId },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in profile register API:', error);
    return NextResponse.json(
      { error: 'Failed to create profile', details: error.message },
      { status: 500 }
    );
  }
}

