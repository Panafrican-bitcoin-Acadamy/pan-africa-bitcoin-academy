import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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

    // Get student profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
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

    // Normalize answer for comparison (case-insensitive, trim whitespace)
    const normalizedAnswer = answer.trim().toLowerCase();
    const normalizedCorrectAnswer = assignment.correct_answer
      .trim()
      .toLowerCase();

    // Check if answer is correct
    const isCorrect = normalizedAnswer === normalizedCorrectAnswer;
    const pointsEarned = isCorrect ? assignment.points : 0;

    // Check if submission already exists
    const { data: existingSubmission } = await supabaseAdmin
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', profile.id)
      .maybeSingle();

    let submission;
    if (existingSubmission) {
      // Update existing submission
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('assignment_submissions')
        .update({
          answer: answer,
          is_correct: isCorrect,
          points_earned: pointsEarned,
          status: isCorrect ? 'graded' : 'submitted',
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
          status: isCorrect ? 'graded' : 'submitted',
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

      // Update student's assignments_completed count if correct
      if (isCorrect) {
        const { data: student } = await supabaseAdmin
          .from('students')
          .select('assignments_completed')
          .eq('profile_id', profile.id)
          .single();

        if (student) {
          await supabaseAdmin
            .from('students')
            .update({
              assignments_completed: (student.assignments_completed || 0) + 1,
            })
            .eq('profile_id', profile.id);
        }

        // Award sats reward for completing assignment
        const { data: existingReward } = await supabaseAdmin
          .from('sats_rewards')
          .select('*')
          .eq('student_id', profile.id)
          .maybeSingle();

        const rewardAmount = 50; // 50 sats for completing an assignment

        if (existingReward) {
          await supabaseAdmin
            .from('sats_rewards')
            .update({
              amount_pending:
                (existingReward.amount_pending || 0) + rewardAmount,
            })
            .eq('id', existingReward.id);
        } else {
          await supabaseAdmin.from('sats_rewards').insert({
            student_id: profile.id,
            amount_pending: rewardAmount,
            reward_type: 'assignment',
            related_entity_type: 'assignment',
            related_entity_id: assignmentId,
            status: 'pending',
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        isCorrect,
        pointsEarned,
        message: isCorrect
          ? 'Correct! You earned ' + pointsEarned + ' points.'
          : 'Incorrect answer. Please try again.',
      },
    });
  } catch (error: any) {
    console.error('Error in submit assignment API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
