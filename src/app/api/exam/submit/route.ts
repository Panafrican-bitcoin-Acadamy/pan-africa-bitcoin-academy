import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { examQuestions } from '@/content/examQuestions';
import { validateAndNormalizeEmail } from '@/lib/validation';
import { requireStudent } from '@/lib/session';
import { requireAdmin } from '@/lib/adminSession';

/**
 * Submit final exam answers and calculate score
 * Validates that:
 * 1. Student has access
 * 2. All 50 questions have exactly one answer
 * 3. Student hasn't already submitted
 */
export async function POST(req: NextRequest) {
  try {
    const { email, answers } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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

    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Answers must be a valid object' },
        { status: 400 }
      );
    }

    // Validate answers structure - must be object with question IDs as keys
    const answerKeys = Object.keys(answers);
    if (answerKeys.length === 0) {
      return NextResponse.json(
        { error: 'At least one answer is required' },
        { status: 400 }
      );
    }

    // Validate each answer value is a string and reasonable length
    for (const [questionId, answerValue] of Object.entries(answers)) {
      if (typeof answerValue !== 'string') {
        return NextResponse.json(
          { error: `Answer for question ${questionId} must be a string` },
          { status: 400 }
        );
      }
      if (answerValue.length > 100) {
        return NextResponse.json(
          { error: `Answer for question ${questionId} is too long (max 100 characters)` },
          { status: 400 }
        );
      }
      // Validate question ID format (should be valid UUID or numeric)
      if (!/^[0-9a-f-]+$/i.test(questionId) && !/^\d+$/.test(questionId)) {
        return NextResponse.json(
          { error: 'Invalid question ID format' },
          { status: 400 }
        );
      }
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
    if (sessionEmail !== emailValidation.normalized) {
      return NextResponse.json(
        { error: 'Unauthorized. Email does not match your session.' },
        { status: 403 }
      );
    }

    const isAdmin = !!adminSession;

    // Step 1: Get profile by email (admins might not have profiles with matching IDs)
    let profile;
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', emailValidation.normalized)
      .maybeSingle();

    if (profileError || !existingProfile) {
      // Profile should exist for authenticated users
      return NextResponse.json(
        { error: 'Profile not found. Please contact support.' },
        { status: 404 }
      );
    }
    
    profile = existingProfile;

    // Step 2: Check if exam already completed (skip for admins to allow retakes for testing)
    if (!isAdmin) {
      const { data: existingResult, error: existingError } = await supabaseAdmin
        .from('exam_results')
        .select('id, score')
        .eq('student_id', profile.id)
        .maybeSingle();

      if (existingResult) {
        return NextResponse.json(
          {
            error: 'Exam already submitted',
            score: existingResult.score,
            message: 'You have already completed the exam',
          },
          { status: 400 }
        );
      }
    }

    // Step 3: Validate answers - check all 50 questions have exactly one answer
    const validationErrors: number[] = [];
    const validAnswers: Record<string, string> = {};

    for (let i = 1; i <= 50; i++) {
      const answer = answers[i.toString()];
      
      if (!answer || typeof answer !== 'string') {
        validationErrors.push(i);
        continue;
      }

      // Validate answer is A, B, C, or D
      if (!['A', 'B', 'C', 'D'].includes(answer.toUpperCase())) {
        validationErrors.push(i);
        continue;
      }

      validAnswers[i.toString()] = answer.toUpperCase();
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Invalid answers',
          missingQuestions: validationErrors,
          message: `Please answer all questions. Missing answers for questions: ${validationErrors.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Step 4: Calculate score
    let correctCount = 0;
    const questionResults: Record<string, { selected: string; correct: string; isCorrect: boolean }> = {};

    examQuestions.forEach((question) => {
      const selectedAnswer = validAnswers[question.id.toString()];
      const isCorrect = selectedAnswer === question.correctAnswer;
      
      if (isCorrect) {
        correctCount++;
      }

      questionResults[question.id.toString()] = {
        selected: selectedAnswer,
        correct: question.correctAnswer,
        isCorrect,
      };
    });

    const score = correctCount;
    const totalQuestions = 50;
    const percentage = Math.round((score / totalQuestions) * 100);

    // Step 5: Store exam result (update if admin and already exists, otherwise insert)
    let examResult;
    if (isAdmin) {
      // Check if result exists
      const { data: existingResult } = await supabaseAdmin
        .from('exam_results')
        .select('id')
        .eq('student_id', profile.id)
        .maybeSingle();

      if (existingResult) {
        // Update existing result for admins (testing purposes)
        const { data: updatedResult, error: updateError } = await supabaseAdmin
          .from('exam_results')
          .update({
            score,
            total_questions: totalQuestions,
            answers: validAnswers,
            submitted_at: new Date().toISOString(),
          })
          .eq('student_id', profile.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating exam result:', updateError);
          return NextResponse.json(
            { error: 'Failed to update exam result', details: updateError.message },
            { status: 500 }
          );
        }
        examResult = updatedResult;
      } else {
        // Insert new result
        const { data: newResult, error: insertError } = await supabaseAdmin
          .from('exam_results')
          .insert({
            student_id: profile.id,
            score,
            total_questions: totalQuestions,
            answers: validAnswers,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error storing exam result:', insertError);
          return NextResponse.json(
            { error: 'Failed to store exam result', details: insertError.message },
            { status: 500 }
          );
        }
        examResult = newResult;
      }
    } else {
      // Regular students - insert only
      const { data: newResult, error: resultError } = await supabaseAdmin
        .from('exam_results')
        .insert({
          student_id: profile.id,
          score,
          total_questions: totalQuestions,
          answers: validAnswers,
        })
        .select()
        .single();

      if (resultError) {
        console.error('Error storing exam result:', resultError);
        return NextResponse.json(
          { error: 'Failed to store exam result', details: resultError.message },
          { status: 500 }
        );
      }
      examResult = newResult;
    }

    // Step 6: Update students table with exam score (if student record exists)
    const { error: updateError } = await supabaseAdmin
      .from('students')
      .update({
        exam_score: score,
        exam_completed_at: new Date().toISOString(),
      })
      .eq('profile_id', profile.id);

    if (updateError) {
      // Don't fail the request, just log the error (admin might not have student record)
      console.log('Note: Could not update student exam score (may not have student record):', updateError.message);
    }

    return NextResponse.json({
      success: true,
      score,
      totalQuestions,
      percentage,
      correctCount,
      incorrectCount: totalQuestions - correctCount,
      submittedAt: examResult.submitted_at,
      message: `Exam submitted successfully! You scored ${score} out of ${totalQuestions} (${percentage}%)`,
    });
  } catch (error: any) {
    console.error('Error submitting exam:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit exam',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
