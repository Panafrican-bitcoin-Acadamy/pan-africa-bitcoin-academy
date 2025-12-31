'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';

interface Chapter8AssignmentProps {
  assignmentId: string;
}

// BIP39 word list (first 50 words for demo - in production you'd use the full list)
const BIP39_WORDS = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
  'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
  'action', 'actor', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult',
  'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent', 'agree',
  'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert', 'alien'
];

function generateRandomSeed(): string[] {
  const seed: string[] = [];
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * BIP39_WORDS.length);
    seed.push(BIP39_WORDS[randomIndex]);
  }
  return seed;
}

export function Chapter8Assignment({ assignmentId }: Chapter8AssignmentProps) {
  const { profile, isAuthenticated } = useAuth();
  const { isAuthenticated: isAdminAuth, email: adminEmail, loading: adminLoading } = useSession('admin');
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const [studentInputs, setStudentInputs] = useState<string[]>(Array(12).fill(''));
  const [reflection, setReflection] = useState('');
  const [seedSaved, setSeedSaved] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate seed phrase on component mount
    if (seedPhrase.length === 0) {
      setSeedPhrase(generateRandomSeed());
    }
  }, []);

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
      if (!email) {
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/assignments?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch assignments' }));
        console.error('Error fetching assignments:', errorData);
        setError(errorData.error || 'Failed to fetch assignments. Please try again.');
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      const thisAssignment = data.assignments?.find((a: any) => a.id === assignmentId);
      if (thisAssignment?.submission) {
        setSubmissionStatus(thisAssignment.submission);
        setSubmitted(true);
        if (thisAssignment.submission.answer) {
          try {
            const answerData = JSON.parse(thisAssignment.submission.answer);
            if (answerData.seedPhrase) {
              setSeedPhrase(answerData.seedPhrase);
              setStudentInputs(answerData.studentInputs || Array(12).fill(''));
            }
            setReflection(answerData.reflection || '');
          } catch (e) {
            // Legacy format, ignore
          }
        }
      }
    } catch (err: any) {
      console.error('Error checking submission status:', err);
      setError(err.message || 'Failed to fetch assignment status. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...studentInputs];
    newInputs[index] = value.toLowerCase().trim();
    setStudentInputs(newInputs);
  };

  const getInputClassName = (index: number): string => {
    if (!studentInputs[index]) {
      return 'w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition font-mono text-sm';
    }
    
    const isCorrect = studentInputs[index] === seedPhrase[index];
    if (isCorrect) {
      return 'w-full rounded-lg border-2 border-green-500/50 bg-green-900/20 px-4 py-2 text-green-100 placeholder:text-zinc-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition font-mono text-sm';
    } else {
      return 'w-full rounded-lg border-2 border-red-500/50 bg-red-900/20 px-4 py-2 text-red-100 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition font-mono text-sm';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = isAdminAuth && adminEmail ? adminEmail : profile?.email;
    if ((!isAuthenticated && !isAdminAuth) || !email) {
      setError('Please log in to submit your assignment.');
      return;
    }

    if (!seedSaved) {
      setError('Please click "Saved" after writing down your seed phrase before proceeding.');
      return;
    }

    if (studentInputs.some(input => !input)) {
      setError('Please complete all 12 seed phrase words.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const answerData = {
        seedPhrase,
        studentInputs,
        reflection: reflection.trim() || '', // Optional reflection
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to submit assignment' }));
        throw new Error(errorData.error || 'Failed to submit assignment');
      }

      const data = await response.json();

      setSubmitted(true);
      setSubmissionStatus(data.submission);
    } catch (err: any) {
      console.error('Error submitting assignment:', err);
      setError(err.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const generateNewSeed = () => {
    const newSeed = generateRandomSeed();
    setSeedPhrase(newSeed);
    setStudentInputs(Array(12).fill(''));
    setSeedSaved(false); // Reset saved state when generating new seed
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
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">Assignment: First Wallet Proof</h3>
        <p className="text-sm text-zinc-400 mb-4">Create a wallet, back up seed securely, restore it. Reflection: What went wrong or surprised you? | Reward: 200 sats (after instructor review)</p>
      </div>

      {submitted && submissionStatus ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-lg">
            <p className="text-green-200 font-medium mb-2">✓ Assignment Submitted</p>
            <p className="text-sm text-zinc-300 mb-3">Your submission is under instructor review.</p>
            {submissionStatus.status === 'graded' && submissionStatus.is_correct && (
              <p className="text-sm text-green-300 font-medium">✓ Approved! You earned 200 sats.</p>
            )}
          </div>
          
          {/* Show submitted seed phrase restoration and original seed phrase */}
          <div className="space-y-4">
            <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
              <h4 className="text-sm font-semibold text-zinc-300 mb-3">Your Original Seed Phrase:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-zinc-950 rounded border border-zinc-700">
                {seedPhrase.map((word, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 w-6">{index + 1}.</span>
                    <code className="flex-1 font-mono text-sm text-zinc-200">{word}</code>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
              <h4 className="text-sm font-semibold text-zinc-300 mb-3">Your Seed Phrase Restoration:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {studentInputs.map((input, index) => (
                  <div key={index}>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Word {index + 1}
                    </label>
                    <input
                      type="text"
                      value={input}
                      disabled
                      className={getInputClassName(index)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {reflection && (
            <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
              <p className="text-sm font-medium text-zinc-400 mb-2">Your Reflection:</p>
              <p className="text-zinc-200 whitespace-pre-wrap">{reflection}</p>
            </div>
          )}

          <button
            onClick={() => {
              setSubmitted(false);
              setSubmissionStatus(null);
            }}
            className="text-sm text-cyan-400 hover:text-cyan-300 underline"
          >
            Edit Submission
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Show seed phrase */}
          <div className="space-y-3 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-zinc-200">Step 1: Your Seed Phrase (Write this down securely!)</h4>
              <button
                type="button"
                onClick={() => {
                  generateNewSeed();
                  setSeedSaved(false);
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 underline"
              >
                Generate New Seed
              </button>
            </div>
            <p className="text-xs text-zinc-400">Write down these 12 words in order. You'll need to restore them in Step 2.</p>
            {!seedSaved ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-zinc-950 rounded border border-zinc-700">
                {seedPhrase.map((word, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 w-6">{index + 1}.</span>
                    <code className="flex-1 font-mono text-sm text-zinc-200">{word}</code>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-zinc-950 rounded border border-zinc-700">
                {Array.from({ length: 12 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 w-6">{index + 1}.</span>
                    <code className="flex-1 font-mono text-sm text-zinc-500">••••••••</code>
                  </div>
                ))}
              </div>
            )}
            {!seedSaved && (
              <button
                type="button"
                onClick={() => setSeedSaved(true)}
                className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-orange-500 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
              >
                Saved
              </button>
            )}
            {seedSaved && (
              <div className="p-3 bg-green-900/20 border border-green-800/50 rounded-lg">
                <p className="text-xs text-green-300">✓ Seed phrase saved! Now proceed to Step 2.</p>
              </div>
            )}
          </div>

          {/* Step 2: Restore seed phrase - only show if seed is saved */}
          {seedSaved && (
            <div className="space-y-3 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
              <h4 className="text-base font-semibold text-zinc-200">Step 2: Restore Your Seed Phrase</h4>
              <p className="text-xs text-zinc-400">Enter the 12 words in order. Fields turn green if correct, red if incorrect.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index}>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Word {index + 1}
                  </label>
                  <input
                    type="text"
                    value={studentInputs[index]}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    className={getInputClassName(index)}
                    placeholder="Enter word"
                    required
                  />
                </div>
              ))}
            </div>
              <p className="text-xs text-zinc-500 mt-2">
                {studentInputs.filter((input, index) => input && input === seedPhrase[index]).length} / 12 words correct
              </p>
            </div>
          )}

          {/* Reflection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Reflection: What went wrong or surprised you? <span className="text-zinc-500 text-xs">(Optional)</span>
            </label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition resize-none"
              placeholder="Write your reflection about creating the wallet, backing up the seed, and restoring it... (optional)"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-orange-500 px-6 py-3 font-semibold text-black transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Assignment'}
          </button>
        </form>
      )}
    </div>
  );
}

