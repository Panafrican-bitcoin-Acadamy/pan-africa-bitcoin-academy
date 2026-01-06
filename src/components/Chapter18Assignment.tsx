'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';

interface Chapter18AssignmentProps {
  assignmentId: string;
}

const ADDRESSES = {
  A: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080',
  B: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
  C: 'bc1p5cyxnuxmeuwuvkwfem96llyxf3s2h0c6h7',
};

const CORRECT_ANSWERS = {
  A: 'P2WPKH',
  B: 'P2SH',
  C: 'Taproot (P2TR)',
};

export function Chapter18Assignment({ assignmentId }: Chapter18AssignmentProps) {
  const { profile, isAuthenticated } = useAuth();
  const { isAuthenticated: isAdminAuth, email: adminEmail, loading: adminLoading } = useSession('admin');
  const [answerA, setAnswerA] = useState('');
  const [answerB, setAnswerB] = useState('');
  const [answerC, setAnswerC] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    if ((isAuthenticated && profile?.email) || (isAdminAuth && adminEmail)) {
      checkSubmissionStatus();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, profile, isAdminAuth, adminEmail]);

  const checkSubmissionStatus = async () => {
    try {
      setLoading(true);
      const email = isAdminAuth && adminEmail ? adminEmail : profile?.email;
      if (!email) return;
      
      const response = await fetch(`/api/assignments?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        const thisAssignment = data.assignments?.find((a: any) => a.id === assignmentId);
        if (thisAssignment?.submission) {
          setSubmissionStatus(thisAssignment.submission);
          setSubmitted(true);
          setShowAnswers(true);
          if (thisAssignment.submission.answer) {
            try {
              const answerData = JSON.parse(thisAssignment.submission.answer);
              setAnswerA(answerData.answerA || '');
              setAnswerB(answerData.answerB || '');
              setAnswerC(answerData.answerC || '');
            } catch (e) {
              // Legacy format, ignore
            }
          }
        }
      }
    } catch (err) {
      console.error('Error checking submission status:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = isAdminAuth && adminEmail ? adminEmail : profile?.email;
    if ((!isAuthenticated && !isAdminAuth) || !email) {
      setError('Please log in to submit your assignment.');
      return;
    }

    if (!answerA || !answerB || !answerC) {
      setError('Please provide answers for all three addresses.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const answerData = {
        answerA,
        answerB,
        answerC,
      };

      const response = await fetch('/api/assignments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          assignmentId,
          answer: JSON.stringify(answerData),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit assignment');
      }

      setSubmitted(true);
      setSubmissionStatus(data.submission);
      setShowAnswers(true); // Show answers after submission
    } catch (err: any) {
      setError(err.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || adminLoading) {
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
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 p-5 shadow-inner space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">Assignment: Script Recognition</h3>
        <p className="text-sm text-zinc-400 mb-4">Identify the script type for each address | Reward: TBD (after instructor review)</p>
      </div>

      {submitted && submissionStatus ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-lg">
            <p className="text-green-200 font-medium mb-2">✓ Assignment Submitted</p>
            <p className="text-sm text-zinc-300 mb-3">Your submission is under instructor review.</p>
            {submissionStatus.status === 'graded' && submissionStatus.is_correct && (
              <p className="text-sm text-green-300 font-medium">✓ Approved!</p>
            )}
          </div>
          
          {/* Show answers after submission */}
          <div className="space-y-3 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
            <p className="text-sm font-medium text-zinc-300 mb-2">Your Answers & Correct Answers:</p>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-zinc-400 mb-1">Address A ({ADDRESSES.A})</p>
                <p className="text-sm text-zinc-200">Your answer: {answerA}</p>
                <p className="text-xs text-green-400 mt-1">Correct: {CORRECT_ANSWERS.A}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">Address B ({ADDRESSES.B})</p>
                <p className="text-sm text-zinc-200">Your answer: {answerB}</p>
                <p className="text-xs text-green-400 mt-1">Correct: {CORRECT_ANSWERS.B}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">Address C ({ADDRESSES.C})</p>
                <p className="text-sm text-zinc-200">Your answer: {answerC}</p>
                <p className="text-xs text-green-400 mt-1">Correct: {CORRECT_ANSWERS.C}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Addresses to copy */}
          <div className="space-y-3 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
            <p className="text-sm font-medium text-zinc-300 mb-3">Copy these addresses and paste each one in the correct script type field below:</p>
            
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="text-sm font-semibold text-zinc-400 sm:w-24 flex-shrink-0">Address A:</span>
                <code className="flex-1 w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-200 font-mono break-all">
                  {ADDRESSES.A}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(ADDRESSES.A)}
                  className="px-4 py-2 min-h-[44px] bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-300 rounded text-sm transition touch-target w-full sm:w-auto"
                >
                  Copy
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="text-sm font-semibold text-zinc-400 sm:w-24 flex-shrink-0">Address B:</span>
                <code className="flex-1 w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-200 font-mono break-all">
                  {ADDRESSES.B}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(ADDRESSES.B)}
                  className="px-4 py-2 min-h-[44px] bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-300 rounded text-sm transition touch-target w-full sm:w-auto"
                >
                  Copy
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="text-sm font-semibold text-zinc-400 sm:w-24 flex-shrink-0">Address C:</span>
                <code className="flex-1 w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-200 font-mono break-all">
                  {ADDRESSES.C}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(ADDRESSES.C)}
                  className="px-4 py-2 min-h-[44px] bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-300 rounded text-sm transition touch-target w-full sm:w-auto"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          {/* Input fields - Mixed arrangement so students must match addresses to script types */}
          {/* Field 1: Taproot (P2TR) → Address C | Field 2: P2WPKH → Address A | Field 3: P2SH → Address B */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                1. <span className="text-cyan-400 font-semibold">{CORRECT_ANSWERS.C}</span> → Paste the matching address here
              </label>
              <input
                type="text"
                value={answerC}
                onChange={(e) => setAnswerC(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition font-mono text-sm"
                placeholder="Paste the address that matches Taproot (P2TR) script type"
                required
              />
              {showAnswers && (
                <p className="mt-1 text-xs text-green-400">Correct address: {ADDRESSES.C}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                2. <span className="text-cyan-400 font-semibold">{CORRECT_ANSWERS.A}</span> → Paste the matching address here
              </label>
              <input
                type="text"
                value={answerA}
                onChange={(e) => setAnswerA(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition font-mono text-sm"
                placeholder="Paste the address that matches P2WPKH script type"
                required
              />
              {showAnswers && (
                <p className="mt-1 text-xs text-green-400">Correct address: {ADDRESSES.A}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                3. <span className="text-cyan-400 font-semibold">{CORRECT_ANSWERS.B}</span> → Paste the matching address here
              </label>
              <input
                type="text"
                value={answerB}
                onChange={(e) => setAnswerB(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition font-mono text-sm"
                placeholder="Paste the address that matches P2SH script type"
                required
              />
              {showAnswers && (
                <p className="mt-1 text-xs text-green-400">Correct address: {ADDRESSES.B}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-orange-500 px-6 py-3 min-h-[48px] font-semibold text-black transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
          >
            {submitting ? 'Submitting...' : 'Submit Assignment'}
          </button>
        </form>
      )}
    </div>
  );
}

