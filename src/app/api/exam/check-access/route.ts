import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Check if a student has access to take the final exam
 * Requirements:
 * 1. Must have completed Chapter 21 (final chapter)
 * 2. Must have admin-granted access
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required', hasAccess: false },
        { status: 400 }
      );
    }

    // Step 0: Check if user is an admin (admins bypass all requirements)
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, email, role')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    const isAdmin = !!admin;

    // If admin, grant full access (bypass Chapter 21 and exam access requirements)
    if (isAdmin) {
      // Check if admin has a profile (they might have one for testing)
      const { data: adminProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      // Check if exam already completed (using profile if exists, otherwise allow multiple attempts for testing)
      let examCompleted = false;
      let examResult = null;
      
      if (adminProfile) {
        const { data: result } = await supabaseAdmin
          .from('exam_results')
          .select('id, score, submitted_at')
          .eq('student_id', adminProfile.id)
          .maybeSingle();
        examCompleted = !!result;
        examResult = result;
      }

      return NextResponse.json({
        hasAccess: true, // Admins always have access (can retake for testing)
        isRegistered: true,
        isEnrolled: true,
        isAdmin: true,
        chapter21Completed: true, // Admins bypass this
        hasAdminAccess: true, // Admins have automatic access
        examCompleted,
        examScore: examResult?.score || null,
        examSubmittedAt: examResult?.submitted_at || null,
        message: examCompleted
          ? 'Admin: You can retake the exam for testing purposes'
          : 'Admin access granted - you can take the exam',
      });
    }

    // Step 1: Check if user has a profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (profileError || !profile) {
      return NextResponse.json({
        hasAccess: false,
        isRegistered: false,
        message: 'Please register to access the exam',
      });
    }

    // Step 2: Check if user is enrolled (has student record)
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, profile_id')
      .eq('profile_id', profile.id)
      .single();

    if (studentError || !student) {
      return NextResponse.json({
        hasAccess: false,
        isRegistered: true,
        isEnrolled: false,
        message: 'Please enroll in a cohort to access the exam',
      });
    }

    // Step 3: Check if Chapter 21 is completed
    const { data: chapter21, error: chapterError } = await supabaseAdmin
      .from('chapter_progress')
      .select('is_completed')
      .eq('student_id', profile.id)
      .eq('chapter_number', 21)
      .maybeSingle();

    const chapter21Completed = chapter21?.is_completed || false;

    // Step 4: Check if admin has granted exam access
    const { data: examAccess, error: accessError } = await supabaseAdmin
      .from('exam_access')
      .select('id, granted_at')
      .eq('student_id', profile.id)
      .maybeSingle();

    const hasAdminAccess = !!examAccess;

    // Step 5: Check if exam already completed
    const { data: examResult, error: resultError } = await supabaseAdmin
      .from('exam_results')
      .select('id, score, submitted_at')
      .eq('student_id', profile.id)
      .maybeSingle();

    const examCompleted = !!examResult;

    // Final access check: Chapter 21 completed AND admin access granted
    const hasAccess = chapter21Completed && hasAdminAccess && !examCompleted;

    return NextResponse.json({
      hasAccess,
      isRegistered: true,
      isEnrolled: true,
      chapter21Completed,
      hasAdminAccess,
      examCompleted,
      examScore: examResult?.score || null,
      examSubmittedAt: examResult?.submitted_at || null,
      message: hasAccess
        ? 'You have access to take the exam'
        : !chapter21Completed
        ? 'Please complete Chapter 21 first'
        : !hasAdminAccess
        ? 'Admin access required. Please contact your administrator.'
        : examCompleted
        ? 'You have already completed the exam'
        : 'Access denied',
    });
  } catch (error: any) {
    console.error('Error checking exam access:', error);
    return NextResponse.json(
      {
        error: 'Failed to check exam access',
        details: error.message,
        hasAccess: false,
      },
      { status: 500 }
    );
  }
}
