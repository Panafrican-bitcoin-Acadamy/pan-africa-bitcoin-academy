/**
 * Instructor-reviewed vs auto-graded assignments and submission lifecycle.
 * DB status values: pending_review | approved | rejected | returned
 * (legacy: submitted | graded still interpreted in getSubmissionPhase).
 */

export type SubmissionPhase = 'none' | 'pending_review' | 'approved' | 'rejected' | 'returned';

/** Safe client hint from GET /api/assignments (no correct_answer exposed). */
export type ClientAssignmentPhaseHint = {
  requiresInstructorReview: boolean;
};

/** Build hint from an assignment row returned by the API. */
export function phaseHintFromRow(
  row: { requiresInstructorReview?: boolean } | null | undefined
): ClientAssignmentPhaseHint | undefined {
  if (row && typeof row.requiresInstructorReview === 'boolean') {
    return { requiresInstructorReview: row.requiresInstructorReview };
  }
  return undefined;
}

export function assignmentRequiresInstructorReview(assignment: {
  correct_answer?: string | null;
  answer_type?: string | null;
}): boolean {
  const ca = (assignment.correct_answer || '').trim();
  return (
    ca === 'INSTRUCTOR_REVIEW' ||
    (assignment.answer_type === 'text' && ca === 'REVIEW_REQUIRED')
  );
}

function syntheticAssignmentFromHint(hint: ClientAssignmentPhaseHint) {
  return {
    correct_answer: hint.requiresInstructorReview ? 'INSTRUCTOR_REVIEW' : '__AUTO_GRADED__',
    answer_type: 'text' as const,
  };
}

function submissionLikeToRow(sub: {
  status?: string | null;
  isCorrect?: boolean | null;
  is_correct?: boolean | null;
  gradedAt?: string | null;
  graded_at?: string | null;
}) {
  return {
    status: sub.status,
    is_correct: sub.is_correct ?? sub.isCorrect,
    graded_at: sub.graded_at ?? sub.gradedAt ?? null,
  };
}

/** Map DB row + assignment definition to a single UI phase. */
export function getSubmissionPhase(
  assignment: {
    correct_answer?: string | null;
    answer_type?: string | null;
  },
  submission: {
    status?: string | null;
    is_correct?: boolean | null;
    graded_at?: string | null;
  } | null
): SubmissionPhase {
  if (!submission) return 'none';

  const st = String(submission.status || '').toLowerCase();
  const correct = submission.is_correct === true;
  const requires = assignmentRequiresInstructorReview(assignment);
  const graded = !!submission.graded_at;

  if (st === 'pending_review') return 'pending_review';
  if (st === 'approved') return 'approved';
  if (st === 'rejected') return 'rejected';
  if (st === 'returned') return 'returned';

  if (st === 'graded') return correct ? 'approved' : 'rejected';

  if (st === 'submitted') {
    if (requires && !graded) return 'pending_review';
    if (!requires && !correct) return 'returned';
    if (!requires && correct) return 'approved';
    return 'pending_review';
  }

  return 'none';
}

/**
 * Client-side phase from a submission blob (prefers `phase` from GET /api/assignments).
 * Pass `assignmentHint` from `requiresInstructorReview` on the assignment row so legacy
 * `submitted` + wrong auto-grade rows infer `returned`, not `pending_review`.
 */
export function inferPhaseFromPartial(
  sub: {
    phase?: SubmissionPhase;
    status?: string | null;
    isCorrect?: boolean | null;
    is_correct?: boolean | null;
    gradedAt?: string | null;
    graded_at?: string | null;
  } | null,
  assignmentHint?: ClientAssignmentPhaseHint | null
): SubmissionPhase {
  if (!sub) return 'none';
  if (sub.phase) return sub.phase;
  if (assignmentHint) {
    return getSubmissionPhase(
      syntheticAssignmentFromHint(assignmentHint),
      submissionLikeToRow(sub)
    );
  }
  const correct = sub.isCorrect === true || sub.is_correct === true;
  const st = String(sub.status || '').toLowerCase();
  if (st === 'pending_review') return 'pending_review';
  if (st === 'approved') return 'approved';
  if (st === 'rejected') return 'rejected';
  if (st === 'returned') return 'returned';
  if (st === 'graded') return correct ? 'approved' : 'rejected';
  /* Legacy without hint: auto-correct sometimes stayed `submitted` + is_correct true */
  if (st === 'submitted' && correct) return 'approved';
  if (st === 'submitted') return 'pending_review';
  return 'none';
}

export function clientSubmissionIsApproved(
  sub: Parameters<typeof inferPhaseFromPartial>[0],
  assignmentHint?: ClientAssignmentPhaseHint | null
) {
  return inferPhaseFromPartial(sub, assignmentHint) === 'approved';
}

export function clientAwaitingInstructorReview(
  sub: Parameters<typeof inferPhaseFromPartial>[0],
  assignmentHint?: ClientAssignmentPhaseHint | null
) {
  return inferPhaseFromPartial(sub, assignmentHint) === 'pending_review';
}

export function clientAllowsAssignmentForm(
  sub: Parameters<typeof inferPhaseFromPartial>[0],
  assignmentHint?: ClientAssignmentPhaseHint | null
) {
  const p = inferPhaseFromPartial(sub, assignmentHint);
  return p === 'none' || p === 'returned' || p === 'rejected';
}

export function clientNeedsResubmit(
  sub: Parameters<typeof inferPhaseFromPartial>[0],
  assignmentHint?: ClientAssignmentPhaseHint | null
) {
  const p = inferPhaseFromPartial(sub, assignmentHint);
  return p === 'rejected' || p === 'returned';
}

export function canStudentSubmitOrReplace(
  phase: SubmissionPhase,
  assignment: { correct_answer?: string | null; answer_type?: string | null }
): { allowed: boolean; reason?: string } {
  if (phase === 'none') return { allowed: true };
  if (phase === 'pending_review') {
    return {
      allowed: false,
      reason: assignmentRequiresInstructorReview(assignment)
        ? 'Already submitted — wait for instructor approval or rejection before submitting again.'
        : 'Submission is being processed.',
    };
  }
  // Auto-graded: allow practice resubmits after a pass (sats only credited once; see auto_sats_awarded).
  if (phase === 'approved' && !assignmentRequiresInstructorReview(assignment)) {
    return { allowed: true };
  }
  if (phase === 'approved') {
    return { allowed: false, reason: 'This assignment is already approved.' };
  }
  return { allowed: true };
}

/** Auto-graded assignment passed — student can practice again without losing their reward. */
export function clientAutoGradedCanPractice(
  sub: Parameters<typeof inferPhaseFromPartial>[0],
  assignmentHint?: ClientAssignmentPhaseHint | null
): boolean {
  if (!assignmentHint || assignmentHint.requiresInstructorReview) return false;
  return inferPhaseFromPartial(sub, assignmentHint) === 'approved';
}
