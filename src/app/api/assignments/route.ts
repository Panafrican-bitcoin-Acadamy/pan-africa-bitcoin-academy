import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/assignments
 * Fetch assignments for a student
 * Returns assignments with submission status
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get student profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, cohort_id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Fetch assignments (active assignments for student's cohort or all cohorts)
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('assignments')
      .select('*')
      .eq('status', 'active')
      .or(`cohort_id.is.null,cohort_id.eq.${profile.cohort_id}`)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch assignments' },
        { status: 500 }
      );
    }

    // Fetch student's submissions
    const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from('assignment_submissions')
      .select('*')
      .eq('student_id', profile.id);

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      // Continue without submissions if error
    }

    // Map submissions by assignment_id for quick lookup
    const submissionsMap = new Map(
      (submissions || []).map((sub) => [sub.assignment_id, sub])
    );

    // Combine assignments with submission status
    const assignmentsWithStatus = (assignments || []).map((assignment) => {
      const submission = submissionsMap.get(assignment.id);
      const isOverdue = assignment.due_date
        ? new Date(assignment.due_date) < new Date()
        : false;
      const isSubmitted = !!submission;
      const isCompleted = submission?.is_correct || false;

      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        question: assignment.question,
        searchAddress: assignment.search_address,
        chapterNumber: assignment.chapter_number,
        chapterSlug: assignment.chapter_slug,
        points: assignment.points,
        dueDate: assignment.due_date,
        isOverdue,
        status: isCompleted
          ? 'completed'
          : isSubmitted
          ? 'submitted'
          : isOverdue
          ? 'overdue'
          : 'pending',
        submission: submission
          ? {
              id: submission.id,
              answer: submission.answer,
              isCorrect: submission.is_correct,
              pointsEarned: submission.points_earned,
              feedback: submission.feedback,
              submittedAt: submission.submitted_at,
            }
          : null,
        link: assignment.chapter_slug
          ? `/chapters/${assignment.chapter_slug}`
          : '/dashboard',
      };
    });

    return NextResponse.json({
      assignments: assignmentsWithStatus,
      total: assignmentsWithStatus.length,
      completed: assignmentsWithStatus.filter((a) => a.status === 'completed')
        .length,
      pending: assignmentsWithStatus.filter((a) => a.status === 'pending')
        .length,
    });
  } catch (error: any) {
    console.error('Error in assignments API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
