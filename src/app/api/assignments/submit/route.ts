import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkAndUnlockAchievements } from '@/lib/achievements';
import { validateAndNormalizeEmail } from '@/lib/validation';
import { sanitizeTextContent } from '@/lib/validation';
import { requireStudent } from '@/lib/session';
import { requireAdmin } from '@/lib/adminSession';

/**
 * POST /api/assignments/submit
 * Submit an assignment answer
 * Validates answer and creates/updates submission
 */
export async function POST(req: NextRequest) {
  try {
    const { email, assignmentId, answer } = await req.json();

    if (!email || !assignmentId || !answer) {
      return NextResponse.json(
        { error: 'Email, assignmentId, and answer are required' },
        { status: 400 }
      );
    }

    // Validate and normalize email
    const emailValidation = validateAndNormalizeEmail(email);
    if (!emailValidation.valid || !emailValidation.normalized) {
      return NextResponse.json(
        { error: emailValidation.error || 'Invalid email format' },
        { status: 400 }
      );
    }
    const normalizedEmail = emailValidation.normalized;

    // Validate assignmentId (should be UUID format)
    if (typeof assignmentId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(assignmentId)) {
      return NextResponse.json(
        { error: 'Invalid assignment ID format' },
        { status: 400 }
      );
    }

    // Sanitize answer - handle both string and JSON answers
    let sanitizedAnswer: string;
    let answerIsJSON = false;
    
    if (typeof answer === 'string') {
      // Try to parse as JSON first (for structured answers like Chapter6Assignment, Chapter8Assignment)
      try {
        const parsed = JSON.parse(answer);
        // If it's a valid JSON object/array, sanitize the stringified version
        const stringified = JSON.stringify(parsed);
        sanitizedAnswer = sanitizeTextContent(stringified, 50000);
        answerIsJSON = true;
      } catch {
        // Not JSON, treat as plain text
        sanitizedAnswer = sanitizeTextContent(answer, 50000);
      }
    } else {
      // Already an object, stringify and sanitize
      sanitizedAnswer = sanitizeTextContent(JSON.stringify(answer), 50000);
      answerIsJSON = true;
    }
    
    if (!sanitizedAnswer || sanitizedAnswer.trim().length === 0) {
      return NextResponse.json(
        { error: 'Answer cannot be empty' },
        { status: 400 }
      );
    }

    // For non-JSON answers, require minimum length
    if (!answerIsJSON && sanitizedAnswer.length < 10) {
      return NextResponse.json(
        { error: 'Answer must be at least 10 characters long' },
        { status: 400 }
      );
    }

    // Check authentication - user must be logged in
    const studentSession = requireStudent(req);
    const adminSession = requireAdmin(req);
    
    if (!studentSession && !adminSession) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    // Verify email matches authenticated session
    const sessionEmail = (studentSession?.email || adminSession?.email)?.toLowerCase().trim();
    if (sessionEmail !== normalizedEmail) {
      return NextResponse.json(
        { error: 'Unauthorized. Email does not match your session.' },
        { status: 403 }
      );
    }

    const isAdmin = !!adminSession;

    // Get profile for authenticated user
    let profile;
    if (!isAdmin) {
      // For students, get profile by session userId
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', studentSession!.userId)
        .single();

      if (profileError || !profileData) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
      }
      profile = profileData;
    } else {
      // For admins, try to get their profile
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();
      
      if (profileData) {
        profile = profileData;
      } else {
        // Admin doesn't have a profile - return error
        return NextResponse.json(
          { error: 'Admin profile not found. Please contact system administrator.' },
          { status: 404 }
        );
      }
    }

    // Get assignment
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .eq('status', 'active')
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or inactive' },
        { status: 404 }
      );
    }

    // Check if this assignment requires instructor review
    // If correct_answer is "INSTRUCTOR_REVIEW", it requires manual grading
    const requiresReview = assignment.correct_answer === 'INSTRUCTOR_REVIEW' || 
                          (assignment.answer_type === 'text' && assignment.correct_answer === 'REVIEW_REQUIRED');

    let isCorrect = false;
    let pointsEarned = 0;

    if (requiresReview) {
      // For assignments requiring review, set status to 'submitted' and is_correct to false
      // Instructor will grade it later
      isCorrect = false;
      pointsEarned = 0;
    } else {
      // Normalize answer for comparison (case-insensitive, trim whitespace)
      // Only for non-JSON answers
      const normalizedAnswer = answerIsJSON ? sanitizedAnswer : sanitizedAnswer.trim().toLowerCase();
      const normalizedCorrectAnswer = assignment.correct_answer
        ? assignment.correct_answer.trim().toLowerCase()
        : '';

      // Check if answer is correct
      isCorrect = normalizedAnswer === normalizedCorrectAnswer;
      pointsEarned = isCorrect ? assignment.points : 0;
    }

    // Check if submission already exists
    const { data: existingSubmission } = await supabaseAdmin
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', profile.id)
      .maybeSingle();

    const wasAlreadyCorrect = existingSubmission?.is_correct === true;
    const isNewlyCorrect = isCorrect && !wasAlreadyCorrect;
    const isNewSubmission = !existingSubmission;

    // Get reward amount (use assignment's reward_sats, default to 200 if not set, max 200)
    const rewardAmount = Math.min(assignment.reward_sats || 200, 200);

    let submission;
    if (existingSubmission) {
      // Update existing submission
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('assignment_submissions')
        .update({
          answer: sanitizedAnswer,
          is_correct: isCorrect,
          points_earned: pointsEarned,
          status: requiresReview ? 'submitted' : (isCorrect ? 'graded' : 'submitted'),
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubmission.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating submission:', updateError);
        return NextResponse.json(
          { error: 'Failed to update submission' },
          { status: 500 }
        );
      }
      submission = updated;
    } else {
      // Create new submission
      const { data: created, error: createError } = await supabaseAdmin
        .from('assignment_submissions')
        .insert({
          assignment_id: assignmentId,
          student_id: profile.id,
          answer: sanitizedAnswer,
          is_correct: isCorrect,
          points_earned: pointsEarned,
          status: requiresReview ? 'submitted' : (isCorrect ? 'graded' : 'submitted'),
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating submission:', createError);
        return NextResponse.json(
          { error: 'Failed to create submission' },
          { status: 500 }
        );
      }
      submission = created;
    }

    // Award sats rewards only for auto-graded correct answers (not for submissions requiring review)
    // For assignments requiring review, sats will be awarded when admin marks it as correct
    if (isNewlyCorrect && !requiresReview) {
      // Use rewardAmount already calculated above (capped at 200 sats maximum)
      
      // Update or insert sats reward
      const { data: existingReward } = await supabaseAdmin
        .from('sats_rewards')
        .select('id, amount_pending')
        .eq('student_id', profile.id)
        .maybeSingle();

      if (existingReward) {
        await supabaseAdmin
          .from('sats_rewards')
          .update({
            amount_pending: (existingReward.amount_pending || 0) + rewardAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingReward.id);
      } else {
        await supabaseAdmin.from('sats_rewards').insert({
          student_id: profile.id,
          amount_pending: rewardAmount,
          reward_type: 'assignment',
          related_entity_type: 'assignment',
          related_entity_id: assignmentId,
          reason: `Assignment completed: ${assignment.title}`,
          status: 'pending',
        });
      }
    }

    // Update student's assignments_completed count and check achievements only if this submission is newly correct
    let newlyUnlockedAchievements: Array<{ id: string; title: string; icon: string; satsReward: number }> = [];
    if (isNewlyCorrect) {
      // Get or create student record
      let { data: student } = await supabaseAdmin
        .from('students')
        .select('id, assignments_completed')
        .eq('profile_id', profile.id)
        .maybeSingle();

      // Create student record if it doesn't exist
      if (!student) {
        const { data: newStudent, error: createError } = await supabaseAdmin
          .from('students')
          .insert({
            profile_id: profile.id,
            assignments_completed: 1,
          })
          .select('id, assignments_completed')
          .single();

        if (createError) {
          console.error('Error creating student record:', createError);
        } else {
          student = newStudent;
        }
      } else {
        // Update existing student record
        await supabaseAdmin
          .from('students')
          .update({
            assignments_completed: (student.assignments_completed || 0) + 1,
          })
          .eq('profile_id', profile.id);
      }

      // Check and unlock achievements (e.g., "3 Assignments Done")
      try {
        newlyUnlockedAchievements = await checkAndUnlockAchievements(profile.id, supabaseAdmin);
      } catch (achievementError) {
        // Don't fail the request if achievement check fails
        console.error('Error checking achievements:', achievementError);
      }
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        isCorrect,
        pointsEarned,
        message: isCorrect
          ? (requiresReview 
              ? 'Submission received! Your work is under instructor review.'
              : 'Correct! You earned ' + pointsEarned + ' points.')
          : requiresReview
          ? 'Submission received! Your work is under instructor review.'
          : 'Incorrect answer. Please try again.',
      },
      newlyUnlockedAchievements: newlyUnlockedAchievements.length > 0 ? newlyUnlockedAchievements : undefined,
    });
  } catch (error: any) {
    console.error('Error in submit assignment API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
