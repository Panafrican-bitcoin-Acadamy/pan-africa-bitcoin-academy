import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkAndUnlockAchievements } from '@/lib/achievements';

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

    // Check if user is an admin (admins can submit assignments too)
    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('id, email, role')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    const isAdmin = !!admin;

    // Get or create profile for admin/student
    let profile;
    if (!isAdmin) {
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (profileError || !profileData) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
      }
      profile = profileData;
    } else {
      // For admins, try to get their profile, or create a dummy one for submission
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();
      
      if (profileData) {
        profile = profileData;
      } else {
        // Admin doesn't have a profile - we'll need to handle this differently
        // For now, return an error suggesting they need a profile
        // Alternatively, we could create a profile or use admin.id
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
      const normalizedAnswer = answer.trim().toLowerCase();
      const normalizedCorrectAnswer = assignment.correct_answer
        .trim()
        .toLowerCase();

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
          answer: answer,
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
          answer: answer,
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

    // Always add reward amount to pending sats when answer is submitted (only for new submissions to avoid double-adding)
    // This reserves the reward amount in pending, whether it's auto-graded or requires instructor review
    if (isNewSubmission) {
      const { data: existingReward } = await supabaseAdmin
        .from('sats_rewards')
        .select('*')
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
          reason: `Assignment submitted: ${assignment.title}`,
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
