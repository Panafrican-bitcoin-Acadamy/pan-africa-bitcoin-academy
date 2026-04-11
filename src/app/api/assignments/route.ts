import { NextRequest, NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabase';

import { assignmentRequiresInstructorReview, getSubmissionPhase } from '@/lib/assignmentReview';

/** Active assignment row from Supabase (fields used for dedupe + phase). */
type AssignmentRow = Record<string, unknown> & {
  id: string;
  correct_answer?: string | null;
  answer_type?: string | null;
  cohort_id?: string | null;
  created_at?: string | null;
  chapter_slug?: string | null;
  title?: string | null;
  due_date?: string | null;
};

type SubmissionRow = Record<string, unknown> & {
  id: string;
  assignment_id: string;
  answer?: unknown;
  is_correct?: boolean | null;
  points_earned?: number | null;
  feedback?: string | null;
  submitted_at?: string | null;
  status?: string | null;
  graded_at?: string | null;
};

function pickBestAssignmentDuplicate(
  candidates: AssignmentRow[],
  profile: { cohort_id?: string | null },
  submissionsMap: Map<string, SubmissionRow>
): AssignmentRow {
  const withSub = candidates.filter((r) => submissionsMap.has(r.id));
  const pool = withSub.length > 0 ? withSub : candidates;

  let best = pool[0];

  for (let i = 1; i < pool.length; i++) {
    const row = pool[i];

    const bestIsExact = !!(profile?.cohort_id && best.cohort_id === profile.cohort_id);
    const rowIsExact = !!(profile?.cohort_id && row.cohort_id === profile.cohort_id);

    if (rowIsExact && !bestIsExact) {
      best = row;
      continue;
    }
    if (bestIsExact && !rowIsExact) continue;

    const bestTs = Date.parse(String(best.created_at || '')) || 0;
    const rowTs = Date.parse(String(row.created_at || '')) || 0;
    if (rowTs > bestTs) best = row;
  }

  return best;
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

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
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('id, email, role')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    const isAdmin = !!admin;

    let profile: { id: string | null; cohort_id: string | null };

    if (!isAdmin) {
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, cohort_id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (profileError || !profileData) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      profile = profileData;
    } else {
      profile = { id: null, cohort_id: null };
    }

    let assignmentsQuery = supabaseAdmin.from('assignments').select('*').eq('status', 'active');

    if (!isAdmin && profile.cohort_id) {
      assignmentsQuery = assignmentsQuery.or(`cohort_id.is.null,cohort_id.eq.${profile.cohort_id}`);
    }

    const { data: assignments, error: assignmentsError } = await assignmentsQuery
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }

    let submissions: SubmissionRow[] = [];

    if (!isAdmin && profile.id) {
      const { data: submissionsData, error: submissionsError } = await supabaseAdmin
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', profile.id);

      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
      } else {
        submissions = (submissionsData || []) as SubmissionRow[];
      }
    }

    if (isAdmin && profile.id) {
      const { data: submissionsData, error: submissionsError } = await supabaseAdmin
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', profile.id);

      if (!submissionsError) {
        submissions = (submissionsData || []) as SubmissionRow[];
      }
    }

    const submissionsMap = new Map(
      (submissions || []).map((sub) => [sub.assignment_id, sub] as [string, SubmissionRow])
    );

    const rows = (assignments || []) as AssignmentRow[];
    const normalize = (v: unknown) => String(v || '').trim().toLowerCase();

    const byKey = new Map<string, AssignmentRow[]>();
    for (const row of rows) {
      const key = `${normalize(row.chapter_slug)}::${normalize(row.title)}`;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(row);
    }

    const dedupedAssignments: AssignmentRow[] = [];
    for (const [, candidates] of byKey) {
      dedupedAssignments.push(pickBestAssignmentDuplicate(candidates, profile, submissionsMap));
    }

    const assignmentsWithStatus = dedupedAssignments.map((assignment) => {
      const submission = submissionsMap.get(assignment.id);

      const isOverdue = assignment.due_date
        ? new Date(String(assignment.due_date)) < new Date()
        : false;

      const phase = submission ? getSubmissionPhase(assignment, submission) : 'none';
      const isCompleted = phase === 'approved';
      const awaitingReview = phase === 'pending_review';
      const needsRevision = phase === 'rejected' || phase === 'returned';
      const requiresInstructorReview = assignmentRequiresInstructorReview(assignment);

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
        requiresInstructorReview,
        phase,
        status: isCompleted
          ? 'completed'
          : awaitingReview
            ? 'pending_review'
            : needsRevision
              ? 'needs_revision'
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
              status: submission.status,
              gradedAt: submission.graded_at,
              phase,
            }
          : null,
        link: assignment.chapter_slug ? `/chapters/${assignment.chapter_slug}` : '/dashboard',
      };
    });

    return NextResponse.json({
      assignments: assignmentsWithStatus,
      total: assignmentsWithStatus.length,
      completed: assignmentsWithStatus.filter((a) => a.status === 'completed').length,
      pending: assignmentsWithStatus.filter((a) =>
        ['pending', 'overdue', 'needs_revision'].includes(a.status)
      ).length,
    });
  } catch (error: unknown) {
    console.error('Error in assignments API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: errMessage(error) },
      { status: 500 }
    );
  }
}
