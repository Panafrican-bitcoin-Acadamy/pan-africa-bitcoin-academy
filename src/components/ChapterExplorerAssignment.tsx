'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
import { ExternalLink, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface ChapterExplorerAssignmentProps {
  chapterSlug: string;
}

export function ChapterExplorerAssignment({ chapterSlug }: ChapterExplorerAssignmentProps) {
  const { profile, isAuthenticated } = useAuth();
  const { isAuthenticated: isAdminAuth, email: adminEmail, loading: adminLoading } = useSession('admin');
  const [assignment, setAssignment] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ((isAuthenticated && profile?.email) || (isAdminAuth && adminEmail)) {
      fetchAssignment();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, profile, isAdminAuth, adminEmail, chapterSlug]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const email = isAdminAuth && adminEmail ? adminEmail : profile?.email;
      if (!email) return;
      
      const response = await fetch(`/api/assignments?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        // Find assignment by chapter_slug
        const found = data.assignments?.find((a: any) => a.chapterSlug === chapterSlug);
        if (found) {
          setAssignment(found);
          if (found.submission) {
            setSubmitted(true);
            setAnswer(found.submission.answer || '');
          }
        }
      }
    } catch (err) {
      console.error('Error fetching assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = isAdminAuth && adminEmail ? adminEmail : profile?.email;
    if ((!isAuthenticated && !isAdminAuth) || !email) {
      setError('Please log in to submit your assignment.');
      return;
    }

    const trimmedAnswer = answer.trim();
    if (!trimmedAnswer) {
      setError('Please enter your answer.');
      return;
    }

    if (!assignment) {
      setError('Assignment not found.');
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
          assignmentId: assignment.id,
          answer: trimmedAnswer,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitted(true);
        // Refresh assignment data
        await fetchAssignment();
      } else {
        setError(data.error || 'Failed to submit assignment');
      }
    } catch (err: any) {
      console.error('Error submitting assignment:', err);
      setError(err.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-purple-400/30 bg-purple-500/10 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="rounded-xl border border-purple-400/30 bg-purple-500/10 p-6">
        <div className="inline-flex items-center gap-2 rounded-lg border border-purple-400/30 bg-purple-500/10 px-4 py-3 text-purple-200">
          <span>📋 Explorer Scavenger Hunt Assignment</span>
        </div>
        <p className="mt-3 text-sm text-zinc-400">
          Assignment not found. Please contact support if this issue persists.
        </p>
      </div>
    );
  }

  const isCompleted = assignment.submission?.isCorrect || false;
  const isSubmittedButIncorrect = assignment.submission && !assignment.submission.isCorrect;

  return (
    <div className="rounded-xl border border-purple-400/30 bg-purple-500/10 p-6">
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 rounded-lg border border-purple-400/30 bg-purple-500/10 px-4 py-3 text-purple-200">
          <span>📋 {assignment.title}</span>
        </div>
        {assignment.description && (
          <p className="mt-3 text-sm text-zinc-400">{assignment.description}</p>
        )}
      </div>

      <div className="space-y-4">
        {/* Question */}
        <div className="rounded-lg border border-zinc-700/50 bg-zinc-950/50 p-4">
          <h3 className="text-sm font-semibold text-zinc-200 mb-2">Question:</h3>
          <p className="text-sm text-zinc-300">{assignment.question}</p>
          
          {assignment.searchAddress && (
            <div className="mt-4 rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3">
              <p className="text-xs font-medium text-cyan-300 mb-2">Search Address:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-cyan-200 break-all font-mono bg-zinc-900/50 px-2 py-1 rounded">
                  {assignment.searchAddress}
                </code>
                <a
                  href={`https://blockstream.info/address/${assignment.searchAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-300 hover:bg-cyan-500/20 transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Explorer
                </a>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                Use a block explorer to search for this address and find the answer.
              </p>
            </div>
          )}
        </div>

        {/* Submission Status */}
        {isCompleted && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-300">Assignment Completed!</p>
              <p className="text-xs text-green-400/80 mt-1">
                You earned {assignment.submission?.pointsEarned || assignment.points} points.
              </p>
              {assignment.submission?.answer && (
                <p className="text-xs text-zinc-400 mt-2">
                  Your answer: <span className="text-zinc-300">{assignment.submission.answer}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {isSubmittedButIncorrect && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-300">Incorrect Answer</p>
              <p className="text-xs text-yellow-400/80 mt-1">
                Please try again. Review the block explorer and make sure you found the correct information.
              </p>
            </div>
          </div>
        )}

        {/* Submission Form */}
        {!isCompleted && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="answer" className="block text-sm font-medium text-zinc-300 mb-2">
                Your Answer <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={submitting || isCompleted}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your answer here..."
                required
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting || isCompleted || !answer.trim()}
                className="rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Answer'
                )}
              </button>
              <span className="text-xs text-zinc-400">
                {assignment.points} points • {assignment.submission ? 'Resubmit' : 'Submit'}
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

