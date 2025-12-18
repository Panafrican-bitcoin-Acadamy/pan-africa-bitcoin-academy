import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Get exam results for a student
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get exam result
    const { data: examResult, error: resultError } = await supabaseAdmin
      .from('exam_results')
      .select('score, total_questions, answers, submitted_at')
      .eq('student_id', profile.id)
      .maybeSingle();

    if (resultError) {
      console.error('Error fetching exam result:', resultError);
      return NextResponse.json(
        { error: 'Failed to fetch exam result' },
        { status: 500 }
      );
    }

    if (!examResult) {
      return NextResponse.json({
        completed: false,
        message: 'No exam result found',
      });
    }

    const percentage = Math.round((examResult.score / examResult.total_questions) * 100);

    return NextResponse.json({
      completed: true,
      score: examResult.score,
      totalQuestions: examResult.total_questions,
      percentage,
      submittedAt: examResult.submitted_at,
      answers: examResult.answers,
    });
  } catch (error: any) {
    console.error('Error fetching exam results:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch exam results',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
