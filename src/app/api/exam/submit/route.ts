import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { examQuestions } from '@/content/examQuestions';

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

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Answers object is required' },
        { status: 400 }
      );
    }

    // Step 0: Check if user is an admin (admins can take exam for testing)
    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    const isAdmin = !!admin;

    // Step 1: Get or create profile
    let profile;
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (profileError || !existingProfile) {
      // If admin and no profile, create a temporary profile for exam
      if (isAdmin) {
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('profiles')
          .insert({
            email: email.toLowerCase().trim(),
            name: 'Admin User',
            status: 'Active',
          })
          .select('id, email')
          .single();

        if (createError || !newProfile) {
          return NextResponse.json(
            { error: 'Failed to create profile for exam' },
            { status: 500 }
          );
        }
        profile = newProfile;
      } else {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
      }
    } else {
      profile = existingProfile;
    }

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
