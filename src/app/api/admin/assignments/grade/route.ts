import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkAndUnlockAchievements } from '@/lib/achievements';

/**
 * POST /api/admin/assignments/grade
 * Grade an assignment submission (approve/reject)
 */
export async function POST(req: NextRequest) {
  try {
    const { email, submissionId, isCorrect, feedback } = await req.json();

    if (!email || !submissionId || typeof isCorrect !== 'boolean') {
      return NextResponse.json(
        { error: 'Email, submissionId, and isCorrect are required' },
        { status: 400 }
      );
    }

    // Verify admin
    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('id, email, role')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Get admin profile for grading
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    // Get submission with assignment details
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('assignment_submissions')
      .select(`
        *,
        assignments (
          id,
          points,
          reward_sats
        ),
        profiles:student_id (
          id,
          email
        )
      `)
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    const assignment = submission.assignments;
    const studentProfile = submission.profiles;
    const wasAlreadyCorrect = submission.is_correct === true;
    const isNewlyCorrect = isCorrect && !wasAlreadyCorrect;

    // Calculate points
    const pointsEarned = isCorrect ? (assignment.points || 10) : 0;
    // Cap reward at 200 sats maximum
    const rewardAmount = isCorrect ? Math.min(assignment.reward_sats || 200, 200) : 0;

    // Update submission
    const { data: updatedSubmission, error: updateError } = await supabaseAdmin
      .from('assignment_submissions')
      .update({
        is_correct: isCorrect,
        points_earned: pointsEarned,
        status: 'graded',
        feedback: feedback || null,
        graded_by: adminProfile?.id || null,
        graded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating submission:', updateError);
      return NextResponse.json(
        { error: 'Failed to update submission' },
        { status: 500 }
      );
    }

    // If newly correct, award sats and check achievements
    if (isNewlyCorrect && studentProfile) {
      // Update or insert sats reward
      const { data: existingReward } = await supabaseAdmin
        .from('sats_rewards')
        .select('id, amount_pending')
        .eq('student_id', studentProfile.id)
        .maybeSingle();

      if (existingReward) {
        await supabaseAdmin
          .from('sats_rewards')
          .update({
            amount_pending: existingReward.amount_pending + rewardAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingReward.id);
      } else {
        await supabaseAdmin
          .from('sats_rewards')
          .insert({
            student_id: studentProfile.id,
            amount_pending: rewardAmount,
            reward_type: 'assignment',
            related_entity_type: 'assignment',
            related_entity_id: assignment.id,
            reason: `Assignment approved: ${assignment.title || 'Assignment'}`,
            status: 'pending',
            awarded_by: adminProfile?.id || null,
          });
      }

      // Update assignments_completed count
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('id, assignments_completed')
        .eq('id', studentProfile.id)
        .maybeSingle();

      if (student) {
        const newCount = (student.assignments_completed || 0) + 1;
        await supabaseAdmin
          .from('students')
          .update({ assignments_completed: newCount })
          .eq('id', studentProfile.id);

        // Check for achievements
        await checkAndUnlockAchievements(studentProfile.id, supabaseAdmin);
      }
    }

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
      message: isCorrect
        ? 'Assignment approved! Student will receive reward.'
        : 'Assignment rejected.',
    });
  } catch (err: any) {
    console.error('Error in POST /api/admin/assignments/grade:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

