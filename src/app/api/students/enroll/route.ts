import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Enroll a student in a cohort
 * This will:
 * 1. Set cohort_id in profiles table (reflects which cohort the student is in)
 * 2. Add record to cohort_enrollment table (many-to-many relationship)
 * 3. Ensure student record exists in students table (academic progress tracking)
 * 4. Update profile status to "Active"
 * 
 * IMPORTANT: All three must happen:
 * - profiles.cohort_id = cohort ID
 * - cohort_enrollment record created
 * - students table record created
 */
export async function POST(req: NextRequest) {
  try {
    const { profileId, cohortId, email } = await req.json();

    // Validate input - need either profileId or email
    if (!profileId && !email) {
      return NextResponse.json(
        { error: 'Either profileId or email is required' },
        { status: 400 }
      );
    }

    if (!cohortId) {
      return NextResponse.json(
        { error: 'cohortId is required' },
        { status: 400 }
      );
    }

    let profileIdToUse = profileId;

    // If email provided, get profile ID
    if (!profileIdToUse && email) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (profileError || !profile) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
      }

      profileIdToUse = profile.id;
    }

    // Verify cohort exists
    const { data: cohort, error: cohortError } = await supabaseAdmin
      .from('cohorts')
      .select('id, name')
      .eq('id', cohortId)
      .maybeSingle();

    if (cohortError || !cohort) {
      return NextResponse.json(
        { error: 'Cohort not found' },
        { status: 404 }
      );
    }

    // Step 1: Set cohort_id in profiles table (reflects which cohort the student is in)
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        status: 'Active',
        cohort_id: cohortId, // Set the cohort ID in profiles table
      })
      .eq('id', profileIdToUse);

    if (profileUpdateError) {
      console.error('Error updating profile cohort_id:', profileUpdateError);
      return NextResponse.json(
        { error: 'Failed to update profile cohort_id', details: profileUpdateError.message },
        { status: 500 }
      );
    }

    // Step 2: Add record to cohort_enrollment table (many-to-many relationship)
    const { data: existingEnrollment } = await supabaseAdmin
      .from('cohort_enrollment')
      .select('id')
      .eq('cohort_id', cohortId)
      .eq('student_id', profileIdToUse)
      .maybeSingle();

    if (!existingEnrollment) {
      const { error: enrollmentError } = await supabaseAdmin
        .from('cohort_enrollment')
        .insert({
          cohort_id: cohortId,
          student_id: profileIdToUse,
        });

      if (enrollmentError) {
        console.error('Error creating enrollment:', enrollmentError);
        return NextResponse.json(
          { error: 'Failed to create cohort enrollment', details: enrollmentError.message },
          { status: 500 }
        );
      }
    }

    // Step 3: Ensure student record exists in students table (for academic progress tracking)
    const { data: existingStudent, error: studentCheckError } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('profile_id', profileIdToUse)
      .maybeSingle();

    let studentId;
    if (!existingStudent) {
      // Create student record - this is required for enrolled students
      const { data: newStudent, error: studentCreateError } = await supabaseAdmin
        .from('students')
        .insert({
          profile_id: profileIdToUse,
          progress_percent: 0,
          assignments_completed: 0,
          projects_completed: 0,
          live_sessions_attended: 0,
        })
        .select('id')
        .single();

      if (studentCreateError) {
        console.error('Error creating student record:', studentCreateError);
        return NextResponse.json(
          { error: 'Failed to create student record', details: studentCreateError.message },
          { status: 500 }
        );
      }

      studentId = newStudent.id;
    } else {
      studentId = existingStudent.id;
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Student enrolled successfully',
        details: {
          profileId: profileIdToUse,
          cohortId: cohortId,
          cohortName: cohort.name,
          studentId: studentId,
          profileCohortIdSet: true, // Confirms cohort_id was set in profiles table
          enrollmentRecordCreated: !existingEnrollment, // True if new enrollment was created
          studentRecordExists: !!existingStudent, // True if student record already existed
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in enroll API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}


}

