import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, attachRefresh } from '@/lib/adminSession';

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

    const emailLower = application.email.toLowerCase().trim();
    const fullName = `${application.first_name} ${application.last_name}`.trim();

    // Check if profile already exists
    let profileId: string;
    let isExistingProfile = false;

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, status, cohort_id, student_id, phone, country, city, password_hash')
      .eq('email', emailLower)
      .maybeSingle();

    // Generate student_id if cohort exists and profile doesn't have one
    let generatedStudentId: string | null = null;
    if (application.preferred_cohort_id && !existingProfile?.student_id) {
      // Get cohort info
      const { data: cohort } = await supabaseAdmin
        .from('cohorts')
        .select('id, name')
        .eq('id', application.preferred_cohort_id)
        .maybeSingle();

      if (cohort) {
        // Count students in this cohort to get roll number
        const { count } = await supabaseAdmin
          .from('cohort_enrollment')
          .select('*', { count: 'exact', head: true })
          .eq('cohort_id', application.preferred_cohort_id);

        const rollNumber = (count || 0) + 1; // Next roll number
        const year = new Date().getFullYear();
        
        // Extract cohort number from name (e.g., "Cohort 1" -> 1) or use roll number
        const cohortMatch = cohort.name.match(/\d+/);
        const cohortNumber = cohortMatch ? cohortMatch[0] : rollNumber.toString();
        
        generatedStudentId = `${cohortNumber}/${rollNumber}/${year}`;
      }
    }

    if (existingProfile) {
      // Link to existing profile - update with application data
      profileId = existingProfile.id;
      isExistingProfile = true;

      // Update profile with all application data
      const updateData: any = {
        name: fullName,
        phone: application.phone || existingProfile.phone || null,
        country: application.country || existingProfile.country || null,
        city: application.city || existingProfile.city || null,
      };

      // Add student_id if generated and profile doesn't have one yet
      if (generatedStudentId && !existingProfile.student_id) {
        // Check if this student_id already exists (shouldn't happen, but safety check)
        const { data: existingStudentId } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('student_id', generatedStudentId)
          .maybeSingle();
        
        if (!existingStudentId) {
          updateData.student_id = generatedStudentId;
        }
      }

      // Update status if it's 'New' (just signed up, now approved)
      if (existingProfile.status === 'New') {
        updateData.status = existingProfile.password_hash ? 'Active' : 'Pending Password Setup';
      }

      await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', profileId);
    } else {
      // Create new profile (without password - they'll set it later)
      const { data: newProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          name: fullName,
          email: emailLower,
          phone: application.phone || null,
          country: application.country || null,
          city: application.city || null,
          student_id: generatedStudentId, // Set student_id on creation
          status: 'Pending Password Setup', // Special status until password is set
          cohort_id: application.preferred_cohort_id || null,
        })
        .select()
        .single();

      if (profileError || !newProfile) {
        console.error('Error creating profile:', profileError);
        return NextResponse.json(
          { error: 'Failed to create profile', details: profileError?.message },
          { status: 500 }
        );
      }

      profileId = newProfile.id;
    }

    // Create student record if it doesn't exist
    const { data: existingStudent } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (!existingStudent) {
      const { error: studentError } = await supabaseAdmin
        .from('students')
        .insert({
          profile_id: profileId,
          progress_percent: 0,
          assignments_completed: 0,
          projects_completed: 0,
          live_sessions_attended: 0,
        });

      if (studentError) {
        console.error('Error creating student record:', studentError);
        // Don't fail - student record can be created later
      }
    }

    // Enroll in cohort if preferred_cohort_id exists
    if (application.preferred_cohort_id) {
      // Check if already enrolled
      const { data: existingEnrollment } = await supabaseAdmin
        .from('cohort_enrollment')
        .select('id')
        .eq('cohort_id', application.preferred_cohort_id)
        .eq('student_id', profileId)
        .maybeSingle();

      if (!existingEnrollment) {
        // Create enrollment
        await supabaseAdmin
          .from('cohort_enrollment')
          .insert({
            cohort_id: application.preferred_cohort_id,
            student_id: profileId,
          });

        // Update profile cohort_id
        await supabaseAdmin
          .from('profiles')
          .update({
            cohort_id: application.preferred_cohort_id,
          })
          .eq('id', profileId);
      }
    }

    // Unlock Chapter 1 for the student
    try {
      const { error: chapterError } = await supabaseAdmin
        .from('chapter_progress')
        .insert({
          student_id: profileId,
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
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update({
        status: 'Approved',
        approved_by: approvedBy || null,
        approved_at: new Date().toISOString(),
        profile_id: profileId,
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Error updating application status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update application status', details: updateError.message },
        { status: 500 }
      );
    }

    // Update profile status to Active if password is already set
    // (If status is 'Pending Password Setup', it means they need to set password)
    if (existingProfile && existingProfile.status !== 'Pending Password Setup') {
      await supabaseAdmin
        .from('profiles')
        .update({
          status: 'Active',
        })
        .eq('id', profileId);
    }

    const res = NextResponse.json({
      success: true,
      message: 'Application approved successfully',
      profileId,
      isExistingProfile,
      needsPasswordSetup: !existingProfile || existingProfile.status === 'Pending Password Setup',
    });
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('Error approving application:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

