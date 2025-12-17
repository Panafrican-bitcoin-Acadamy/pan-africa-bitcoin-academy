import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, attachRefresh } from '@/lib/adminSession';
import { sendApprovalEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId, approvedBy } = await req.json();

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Get the application
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

    if (application.status === 'Approved') {
      return NextResponse.json(
        { error: 'Application is already approved' },
        { status: 400 }
      );
    }

    if (application.status === 'Rejected') {
      return NextResponse.json(
        { error: 'Application was rejected and cannot be approved' },
        { status: 400 }
      );
    }

    const emailLower = application.email?.toLowerCase().trim();
    const fullName = `${application.first_name || ''} ${application.last_name || ''}`.trim();

    // Validate required fields
    if (!emailLower) {
      return NextResponse.json(
        { error: 'Application email is missing' },
        { status: 400 }
      );
    }

    if (!fullName || fullName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Application name is missing' },
        { status: 400 }
      );
    }

    // Check if profile already exists
    let profileId: string;
    let isExistingProfile = false;

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, status, cohort_id, phone, country, city, password_hash')
      .eq('email', emailLower)
      .maybeSingle();

    // Use application.id as the student identifier across all databases
    // This ensures consistency - same ID used in applications, profiles, students, and all other tables
    const studentIdentifier = application.id; // This is the UUID from applications table

    if (existingProfile) {
      // Link to existing profile (basic profile already exists)
      profileId = existingProfile.id;
      isExistingProfile = true;
      // Profile will be updated from students data after students record is created/updated
    } else {
      // Double-check if profile exists (race condition protection)
      const { data: doubleCheckProfile } = await supabaseAdmin
          .from('profiles')
          .select('id, email')
        .eq('email', emailLower)
          .maybeSingle();
        
      if (doubleCheckProfile) {
        // Profile was created between checks - use it
        profileId = doubleCheckProfile.id;
        isExistingProfile = true;
      } else {
        // Create new profile using the same ID as the application
        // This ensures the same ID is used across all databases (applications, profiles, students, etc.)
      const profileData: any = {
          id: studentIdentifier, // Use application.id as profile.id - ensures same ID everywhere
        name: fullName,
        email: emailLower,
        phone: application.phone || null,
        country: application.country || null,
        city: application.city || null,
        status: 'Pending Password Setup', // Special status until password is set
      };

      // Only add cohort_id if it exists and is valid
      if (application.preferred_cohort_id) {
        const { data: cohortCheck } = await supabaseAdmin
          .from('cohorts')
          .select('id')
          .eq('id', application.preferred_cohort_id)
          .maybeSingle();
        
        if (cohortCheck) {
          profileData.cohort_id = application.preferred_cohort_id;
        }
      }

        // Validate required fields before insert
        if (!profileData.name || !profileData.email) {
          return NextResponse.json(
            { 
              error: 'Failed to create profile', 
              details: 'Missing required fields: name and email are required',
            },
            { status: 400 }
          );
        }

      const { data: newProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (profileError || !newProfile) {
        console.error('Error creating profile:', profileError);
        console.error('Profile creation details:', {
          name: fullName,
          email: emailLower,
          phone: application.phone,
          country: application.country,
          city: application.city,
            profile_id: studentIdentifier,
          cohort_id: application.preferred_cohort_id,
        });
          console.error('Full profileError object:', JSON.stringify(profileError, null, 2));
          console.error('Profile data being inserted:', JSON.stringify(profileData, null, 2));
          
          // Check for common errors
          let errorMessage = profileError?.message || 'Unknown error';
          if (profileError?.code === '23505') {
            // Unique constraint violation
            if (profileError?.message?.includes('email')) {
              errorMessage = 'An account with this email already exists. The profile may have been created between checks.';
            } else if (profileError?.message?.includes('id')) {
              errorMessage = 'A profile with this ID already exists';
            } else {
              errorMessage = 'Duplicate entry: ' + (profileError?.message || 'Unique constraint violation');
            }
          } else if (profileError?.code === '23502') {
            // Not null constraint violation
            errorMessage = 'Required field is missing: ' + (profileError?.message || 'Not null constraint violation');
          } else if (profileError?.code === '23503') {
            // Foreign key constraint violation
            errorMessage = 'Invalid reference: ' + (profileError?.message || 'Foreign key constraint violation');
          }
          
        return NextResponse.json(
          { 
            error: 'Failed to create profile', 
              details: errorMessage,
            code: profileError?.code,
            hint: profileError?.hint,
              fullError: process.env.NODE_ENV === 'development' ? profileError : undefined,
          },
          { status: 500 }
        );
      }

      profileId = newProfile.id;
      }
    }

    // STEP 2: Create/Update Students Record (SOURCE OF TRUTH)
    // Students database is the main database - all student data goes here
    // Use the same ID (studentIdentifier) for consistency across all tables
    const { data: existingStudent } = await supabaseAdmin
      .from('students')
      .select('id, name, email, phone, country, city, cohort_id, status, progress_percent, assignments_completed, projects_completed, live_sessions_attended')
      .eq('profile_id', profileId) // profileId is now the same as studentIdentifier (application.id)
      .maybeSingle();

    const studentData: any = {
      profile_id: profileId, // This is the same as studentIdentifier (application.id)
      name: fullName,
      email: emailLower,
      phone: application.phone || null,
      country: application.country || null,
      city: application.city || null,
      cohort_id: application.preferred_cohort_id || null,
      preferred_language: application.preferred_language || null,
      status: 'Enrolled', // Student is enrolled after approval
      progress_percent: existingStudent?.progress_percent || 0,
      assignments_completed: existingStudent?.assignments_completed || 0,
      projects_completed: existingStudent?.projects_completed || 0,
      live_sessions_attended: existingStudent?.live_sessions_attended || 0,
    };
    
    // If creating new student record, use the same ID for consistency
    if (!existingStudent) {
      studentData.id = studentIdentifier; // Use application.id as students.id
    }

    let studentRecord;
    if (existingStudent) {
      // Update existing student record with application data
      const { data: updatedStudent, error: updateError } = await supabaseAdmin
        .from('students')
        .update(studentData)
        .eq('id', existingStudent.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating student record:', updateError);
        return NextResponse.json(
          { error: 'Failed to update student record', details: updateError.message },
          { status: 500 }
        );
      }
      studentRecord = updatedStudent;
    } else {
      // Create new student record (source of truth)
      const { data: newStudent, error: studentError } = await supabaseAdmin
        .from('students')
        .insert(studentData)
        .select()
        .single();

      if (studentError) {
        console.error('Error creating student record:', studentError);
        return NextResponse.json(
          { error: 'Failed to create student record', details: studentError.message },
          { status: 500 }
        );
      }
      studentRecord = newStudent;
    }

    // STEP 3: Update Profile from Students Data (Profile is for display)
    // Profile gets updated from students database (students is source of truth)
    const profileUpdateData: any = {
      name: studentRecord.name,
      phone: studentRecord.phone,
      country: studentRecord.country,
      city: studentRecord.city,
      cohort_id: studentRecord.cohort_id,
    };

    // Update status based on password
    if (existingProfile?.password_hash) {
      profileUpdateData.status = 'Active';
    } else {
      profileUpdateData.status = 'Pending Password Setup';
    }

    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdateData)
      .eq('id', profileId);

    if (profileUpdateError) {
      console.error('Error updating profile from student data:', profileUpdateError);
      // Don't fail - profile update is secondary
    }

    // STEP 4: Enroll in Cohort (if cohort_id exists in students record)
    if (studentRecord.cohort_id) {
      // Check if already enrolled
      // Use the same ID (studentIdentifier) - this is applications.id, profiles.id, and students.id
      const { data: existingEnrollment } = await supabaseAdmin
        .from('cohort_enrollment')
        .select('id')
        .eq('cohort_id', studentRecord.cohort_id)
        .eq('student_id', studentIdentifier) // Use the same ID across all tables
        .maybeSingle();

      if (!existingEnrollment) {
        // Create enrollment using the same ID (studentIdentifier)
        const { error: enrollmentError } = await supabaseAdmin
          .from('cohort_enrollment')
          .insert({
            cohort_id: studentRecord.cohort_id,
            student_id: studentIdentifier, // Same ID as applications.id, profiles.id, students.id
          });

        if (enrollmentError) {
          console.error('Error creating cohort enrollment:', enrollmentError);
          // Don't fail - enrollment can be fixed later
        }
      }
    }

    // Unlock Chapter 1 for the student
    // Use the same ID (studentIdentifier) for consistency
    try {
      const { error: chapterError } = await supabaseAdmin
        .from('chapter_progress')
        .insert({
          student_id: studentIdentifier, // Same ID as applications.id, profiles.id, students.id
          chapter_number: 1,
          chapter_slug: 'the-nature-of-money',
          is_unlocked: true,
          unlocked_at: new Date().toISOString(),
        });

      if (chapterError && !chapterError.message?.includes('duplicate')) {
        console.error('Error unlocking Chapter 1:', chapterError);
        // Don't fail - chapter progress can be set up later
      }
    } catch (chapterError) {
      console.log('Chapter progress table might not exist yet:', chapterError);
      // This is okay - table might not be migrated yet
    }

    // Update application status to Approved
    // profile_id is set to the same ID (studentIdentifier = application.id)
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update({
        status: 'Approved',
        approved_by: approvedBy || null,
        approved_at: new Date().toISOString(),
        profile_id: studentIdentifier, // Same ID - applications.id = profiles.id
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Error updating application status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update application status', details: updateError.message },
        { status: 500 }
      );
    }

    // Profile status is already updated from students data above
    // No need for additional update here

    // Send approval email to student
    let emailSent = false;
    let emailError = null;
    if (studentRecord.cohort_id) {
      // Get cohort name for email
      const { data: cohortData } = await supabaseAdmin
        .from('cohorts')
        .select('name')
        .eq('id', studentRecord.cohort_id)
        .maybeSingle();

      const emailResult = await sendApprovalEmail({
        studentName: fullName,
        studentEmail: emailLower,
        cohortName: cohortData?.name || undefined,
        needsPasswordSetup: !existingProfile || existingProfile.status === 'Pending Password Setup',
      });

      emailSent = emailResult.success;
      emailError = emailResult.error || null;
      
      if (!emailSent) {
        console.warn('Failed to send approval email:', emailError);
        // Don't fail the approval if email fails - just log it
      }
    } else {
      // Send email without cohort name if no cohort assigned
      const emailResult = await sendApprovalEmail({
        studentName: fullName,
        studentEmail: emailLower,
        cohortName: undefined,
        needsPasswordSetup: !existingProfile || existingProfile.status === 'Pending Password Setup',
      });

      emailSent = emailResult.success;
      emailError = emailResult.error || null;
      
      if (!emailSent) {
        console.warn('Failed to send approval email:', emailError);
      }
    }

    const res = NextResponse.json({
      success: true,
      message: 'Application approved successfully',
      profileId,
      isExistingProfile,
      needsPasswordSetup: !existingProfile || existingProfile.status === 'Pending Password Setup',
      emailSent,
      emailError: emailError || undefined,
    });
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('Error approving application:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}


