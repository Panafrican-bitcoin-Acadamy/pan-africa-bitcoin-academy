import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';
import { examQuestions } from '@/content/examQuestions';

const EXAM_TOTAL = examQuestions.length;

/**
 * GET — Full final exam breakdown for a student (admin).
 * Joins stored answers with canonical questions from examQuestions.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ studentId: string }> },
) {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await context.params;
    if (!studentId || !/^[0-9a-f-]{36}$/i.test(studentId)) {
      return NextResponse.json({ error: 'Invalid student id' }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email')
      .eq('id', studentId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const { data: examResult, error: resultError } = await supabaseAdmin
      .from('exam_results')
      .select('score, total_questions, answers, submitted_at')
      .eq('student_id', studentId)
      .maybeSingle();

    if (resultError) {
      console.error('admin exam submission detail:', resultError);
      return NextResponse.json({ error: 'Failed to load exam result' }, { status: 500 });
    }

    if (!examResult) {
      return NextResponse.json({ error: 'No exam submission for this student' }, { status: 404 });
    }

    const totalQuestions = examResult.total_questions ?? EXAM_TOTAL;
    const rawAnswers =
      examResult.answers &&
      typeof examResult.answers === 'object' &&
      !Array.isArray(examResult.answers)
        ? (examResult.answers as Record<string, unknown>)
        : {};

    const questions = examQuestions.map((q) => {
      const key = q.id.toString();
      const selectedRaw = rawAnswers[key];
      const selected =
        typeof selectedRaw === 'string' && ['A', 'B', 'C', 'D'].includes(selectedRaw.toUpperCase())
          ? (selectedRaw.toUpperCase() as 'A' | 'B' | 'C' | 'D')
          : null;
      const isCorrect = selected !== null && selected === q.correctAnswer;
      return {
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        selectedAnswer: selected,
        isCorrect,
      };
    });

    const score = examResult.score ?? 0;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const passMark = Math.ceil(totalQuestions * 0.7);
    const passed = score >= passMark;

    return NextResponse.json({
      student: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
      },
      score,
      totalQuestions,
      percentage,
      passMark,
      passed,
      submittedAt: examResult.submitted_at,
      questions,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
