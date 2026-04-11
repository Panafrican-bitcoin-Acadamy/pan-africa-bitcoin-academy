'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
import {
  clientAwaitingInstructorReview,
  clientAutoGradedCanPractice,
  clientNeedsResubmit,
  clientSubmissionIsApproved,
  phaseHintFromRow,
  type ClientAssignmentPhaseHint,
} from '@/lib/assignmentReview';

interface ChapterAssignmentProps {
  assignmentId: string;
  title: string;
  question: string;
  description?: string;
  points: number;
  rewardSats: number;
}

export function ChapterAssignment({
  assignmentId,
  title,
  question,
  description,
  points,
  rewardSats,
}: ChapterAssignmentProps) {
  const { profile, isAuthenticated, loading: authLoading, sessionEmail } = useAuth();
  const { isAuthenticated: isAdminAuth, email: adminEmail, loading: adminLoading } = useSession('admin');
  const studentEmail = profile?.email || sessionEmail || null;
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<any>(null);
  const [phaseHint, setPhaseHint] = useState<ClientAssignmentPhaseHint | undefined>();
  const [practiceMode, setPracticeMode] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (authLoading || adminLoading) return;
    if ((isAuthenticated && studentEmail) || (isAdminAuth && adminEmail)) {
      checkSubmissionStatus();
    } else {
      setLoading(false);
    }
  }, [authLoading, adminLoading, isAuthenticated, studentEmail, isAdminAuth, adminEmail, assignmentId]);

  const checkSubmissionStatus = async () => {
    try {
      setLoading(true);
      const email = isAdminAuth && adminEmail ? adminEmail : studentEmail;
      if (!email) return;
      
      const response = await fetch(`/api/assignments?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        const thisAssignment = data.assignments?.find((a: any) => a.id === assignmentId);
        setPhaseHint(phaseHintFromRow(thisAssignment));
        if (thisAssignment?.submission) {
          setSubmissionStatus(thisAssignment.submission);
          setSubmitted(true);
          if (thisAssignment.submission.answer) {
            setAnswer(thisAssignment.submission.answer);
          }
        } else {
          setSubmissionStatus(null);
          setSubmitted(false);
        }
      }
    } catch (err) {
      console.error('Error checking submission status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = isAdminAuth && adminEmail ? adminEmail : studentEmail;
    if ((!isAuthenticated && !isAdminAuth) || !email) {
      setError('Please log in to submit your assignment.');
      return;
    }

    // Validate input length
    const trimmedAnswer = answer.trim();
    if (!trimmedAnswer) {
      setError('Please write your response.');
      return;
    }

    if (trimmedAnswer.length < 10) {
      setError('Your response must be at least 10 characters long.');
      return;
    }

    if (trimmedAnswer.length > 50000) {
      setError('Your response is too long. Maximum 50,000 characters allowed.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/assignments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          assignmentId,
          answer: trimmedAnswer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit assignment');
      }

      setPracticeMode(false);
      setSubmitted(true);
      setSubmissionStatus(data.submission);
    } catch (err: any) {
      setError(err.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading || adminLoading) {
    return (
      <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 p-5">
        <div className="animate-pulse">
          <div className="h-6 bg-zinc-800 rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-zinc-800 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isAdminAuth) {
    return (
      <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 p-5">
        <p className="text-zinc-400">Please log in to view and complete this assignment.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 p-5 shadow-inner">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-zinc-400 mb-3">{description}</p>
        )}
        <div className="mb-4 p-4 bg-zinc-900/80 rounded-lg border border-zinc-800/50">
          <p className="text-zinc-200 font-medium mb-2">Task:</p>
          <p className="text-zinc-300">{question}</p>
          <p className="text-sm text-zinc-400 mt-2">Deliverable: Text submission</p>
          <p className="text-sm text-zinc-400">Reward: {rewardSats} sats (awarded after instructor review)</p>
        </div>
      </div>

      {submitted && submissionStatus && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-lg border ${
              clientSubmissionIsApproved(submissionStatus, phaseHint)
                ? 'bg-green-900/20 border-green-800/50'
                : clientNeedsResubmit(submissionStatus, phaseHint)
                  ? 'bg-red-900/20 border-red-800/50'
                  : clientAwaitingInstructorReview(submissionStatus, phaseHint)
                    ? 'bg-amber-900/20 border-amber-800/50'
                    : 'bg-green-900/20 border-green-800/50'
            }`}
          >
            <p
              className={`font-medium mb-2 ${
                clientSubmissionIsApproved(submissionStatus, phaseHint)
                  ? 'text-green-200'
                  : clientNeedsResubmit(submissionStatus, phaseHint)
                    ? 'text-red-200'
                    : 'text-amber-100'
              }`}
            >
              {clientSubmissionIsApproved(submissionStatus, phaseHint)
                ? '✓ Approved'
                : clientNeedsResubmit(submissionStatus, phaseHint)
                  ? 'Revision needed'
                  : '⏳ Submitted — awaiting review'}
            </p>
            <p className="text-sm text-zinc-300 mb-3">
              {clientSubmissionIsApproved(submissionStatus, phaseHint)
                ? `Your submission was approved. You will receive ${rewardSats} sats (pending payout per academy schedule).`
                : clientNeedsResubmit(submissionStatus, phaseHint)
                  ? 'Your instructor asked for changes. Read the feedback below and submit again.'
                  : `Your submission is with the instructor. Until it is approved or returned for revision, you cannot submit again. You will receive ${rewardSats} sats once approved.`}
            </p>
            {clientAutoGradedCanPractice(submissionStatus, phaseHint) && (
              <p className="text-xs text-zinc-500 mb-2">
                Practice again below if you like — your sats for this task are counted once and are not removed when you retry.
              </p>
            )}
            {clientNeedsResubmit(submissionStatus, phaseHint) && submissionStatus.feedback && (
              <div className="mt-2">
                <p className="text-sm text-red-300 font-medium">Instructor feedback</p>
                <p className="text-sm text-zinc-300">{submissionStatus.feedback}</p>
              </div>
            )}
          </div>
          <div className="p-4 bg-zinc-900/80 rounded-lg border border-zinc-800/50">
            <p className="text-sm font-medium text-zinc-400 mb-2">Your Submission:</p>
            <p className="text-zinc-200 whitespace-pre-wrap">{submissionStatus.answer}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {clientNeedsResubmit(submissionStatus, phaseHint) && (
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setSubmissionStatus(null);
                  setPracticeMode(false);
                }}
                className="text-sm text-cyan-400 hover:text-cyan-300 underline px-2 py-1 min-h-[32px] touch-target"
              >
                Resubmit Assignment
              </button>
            )}
            {clientAutoGradedCanPractice(submissionStatus, phaseHint) && (
              <button
                type="button"
                onClick={() => setPracticeMode(true)}
                className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-200 transition hover:bg-green-500/20"
              >
                Practice again
              </button>
            )}
          </div>
        </div>
      )}

      {(!submitted || practiceMode || clientNeedsResubmit(submissionStatus, phaseHint)) && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {practiceMode && clientAutoGradedCanPractice(submissionStatus, phaseHint) && (
            <p className="text-sm text-cyan-200/90">Practice mode — your earned reward stays on your account.</p>
          )}
          <div>
              <label htmlFor="answer" className="block text-sm font-medium text-zinc-300 mb-2">
                Your Response
              </label>
              <textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={8}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition resize-none"
                placeholder="Write your response..."
                required
              />
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !answer.trim()}
            className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-orange-500 px-6 py-3 min-h-[48px] font-semibold text-black transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
          >
            {submitting ? 'Submitting...' : 'Submit Assignment'}
          </button>
        </form>
      )}
    </div>
  );
}

