'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { PageContainer } from '@/components/PageContainer';
import Link from 'next/link';

export default function AssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, profile, loading: authLoading } = useAuth();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Get email from profile or localStorage
  const email = profile?.email || (typeof window !== 'undefined' ? localStorage.getItem('profileEmail') : null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
      return;
    }

    if (email) {
      fetchAssignment();
    }
  }, [email, assignmentId, isAuthenticated, authLoading]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assignments?email=${encodeURIComponent(email!)}`);
      
      if (response.ok) {
        const data = await response.json();
        const found = data.assignments.find((a: any) => a.id === assignmentId);
        
        if (found) {
          setAssignment(found);
          setSubmission(found.submission);
          if (found.submission) {
            setAnswer(found.submission.answer);
          }
        } else {
          setMessage({ type: 'error', text: 'Assignment not found' });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load assignment' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!answer.trim()) {
      setMessage({ type: 'error', text: 'Please enter an answer' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);

      const response = await fetch('/api/assignments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          assignmentId,
          answer: answer.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          type: data.submission.isCorrect ? 'success' : 'error',
          text: data.submission.message,
        });
        
        // Refresh assignment data
        await fetchAssignment();
        
        // If correct, update assignments completed count
        if (data.submission.isCorrect) {
          // Trigger a page refresh to update dashboard stats
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit assignment' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to submit assignment' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Assignment" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      </PageContainer>
    );
  }

  if (!assignment) {
    return (
      <PageContainer title="Assignment Not Found" subtitle="The assignment you're looking for doesn't exist">
        <div className="text-center py-12">
          <p className="text-zinc-400 mb-4">Assignment not found</p>
          <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300">
            Return to Dashboard
          </Link>
        </div>
      </PageContainer>
    );
  }

  const isCompleted = assignment.status === 'completed';
  const canSubmit = !isCompleted;

  return (
    <PageContainer
      title={assignment.title}
      subtitle={assignment.description || 'Complete this assignment to earn points'}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Assignment Info */}
        <div className="rounded-xl border border-orange-400/25 bg-black/80 p-6">
          <div className="mb-4 space-y-2">
            <h2 className="text-xl font-semibold text-orange-200">{assignment.title}</h2>
            {assignment.description && (
              <p className="text-zinc-300">{assignment.description}</p>
            )}
          </div>

          {assignment.question && (
            <div className="mb-4 rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
              <h3 className="mb-2 text-sm font-semibold text-cyan-200">Question:</h3>
              <p className="text-zinc-100 whitespace-pre-line">{assignment.question}</p>
            </div>
          )}

          {assignment.searchAddress && (
            <div className="mb-4 rounded-lg border border-purple-400/20 bg-purple-500/10 p-4">
              <h3 className="mb-2 text-sm font-semibold text-purple-200">Search for:</h3>
              <p className="font-mono text-sm text-purple-100 break-all">{assignment.searchAddress}</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <span>Points: <span className="text-orange-300 font-semibold">{assignment.points}</span></span>
            {assignment.dueDate && (
              <span>
                Due: <span className="text-orange-300">{new Date(assignment.dueDate).toLocaleDateString()}</span>
              </span>
            )}
            {assignment.chapterSlug && (
              <Link
                href={`/chapters/${assignment.chapterSlug}`}
                className="text-cyan-400 hover:text-cyan-300"
              >
                View Chapter →
              </Link>
            )}
          </div>
        </div>

        {/* Submission Status */}
        {isCompleted && submission && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✓</span>
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-semibold text-green-200">Assignment Completed!</h3>
                <p className="mb-2 text-zinc-300">Your answer: <span className="font-semibold">{submission.answer}</span></p>
                <p className="text-green-300">Points earned: <span className="font-semibold">{submission.pointsEarned}</span></p>
                {submission.feedback && (
                  <p className="mt-2 text-sm text-zinc-300">{submission.feedback}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submission Form */}
        {canSubmit && (
          <form onSubmit={handleSubmit} className="rounded-xl border border-cyan-400/25 bg-black/80 p-6 space-y-4">
            <div>
              <label htmlFor="answer" className="mb-2 block text-sm font-medium text-zinc-300">
                Your Answer <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="answer"
                name="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={submitting || isCompleted}
                className="w-full rounded-lg border border-cyan-400/30 bg-zinc-950 px-4 py-3 text-zinc-50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
                placeholder="Enter your answer here..."
                autoComplete="off"
              />
              {assignment.searchAddress && (
                <p className="mt-2 text-xs text-zinc-400">
                  Use a block explorer to search for the address above and find the answer.
                </p>
              )}
            </div>

            {message && (
              <div
                className={`rounded-lg border p-4 ${
                  message.type === 'success'
                    ? 'border-green-500/30 bg-green-500/10 text-green-200'
                    : 'border-red-500/30 bg-red-500/10 text-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-center font-medium text-zinc-300 transition hover:bg-zinc-800"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !answer.trim()}
                className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-orange-500 px-4 py-3 font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            </div>
          </form>
        )}

        {/* Previous Submission (if incorrect) */}
        {submission && !isCompleted && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-6">
            <h3 className="mb-2 text-sm font-semibold text-yellow-200">Previous Submission</h3>
            <p className="text-zinc-300">Your answer: <span className="font-semibold">{submission.answer}</span></p>
            <p className="mt-2 text-sm text-yellow-300">This answer was incorrect. Please try again.</p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
