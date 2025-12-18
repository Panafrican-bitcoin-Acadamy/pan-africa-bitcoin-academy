import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Admin endpoint to get list of students with exam access status
 */
export async function GET(req: NextRequest) {
  try {
    // Get all students with their exam access status
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        name,
        email,
        status,
        cohort_id,
        cohorts:cohort_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      );
    }

    // Get exam access records
    const { data: examAccess, error: accessError } = await supabaseAdmin
      .from('exam_access')
      .select('student_id, granted_at, granted_by');

    // Get exam results
    const { data: examResults, error: resultsError } = await supabaseAdmin
      .from('exam_results')
      .select('student_id, score, submitted_at');

    // Get chapter 21 completion status
    const { data: chapter21Progress, error: chapterError } = await supabaseAdmin
      .from('chapter_progress')
      .select('student_id, is_completed')
      .eq('chapter_number', 21);

    // Combine data
    const studentsWithExamStatus = students?.map((student) => {
      const hasAccess = examAccess?.some((ea) => ea.student_id === student.id) || false;
      const examResult = examResults?.find((er) => er.student_id === student.id);
      const chapter21Completed = chapter21Progress?.some(
        (cp) => cp.student_id === student.id && cp.is_completed
      ) || false;

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        status: student.status,
        cohortId: student.cohort_id,
        cohortName: (student.cohorts as any)?.name || null,
        chapter21Completed,
        hasExamAccess: hasAccess,
        examCompleted: !!examResult,
        examScore: examResult?.score || null,
        examSubmittedAt: examResult?.submitted_at || null,
      };
    }) || [];

    return NextResponse.json({
      students: studentsWithExamStatus,
    });
  } catch (error: any) {
    console.error('Error fetching exam access list:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch exam access list',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
