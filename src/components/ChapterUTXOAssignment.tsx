'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
import { Lock } from 'lucide-react';

interface ChapterUTXOAssignmentProps {
  assignmentId: string;
}

interface UTXO {
  id: 'A' | 'B' | 'C';
  amount: number; // in BTC
  selected: boolean;
}

const UTXOS: UTXO[] = [
  { id: 'A', amount: 0.01, selected: false },
  { id: 'B', amount: 0.004, selected: false },
  { id: 'C', amount: 0.002, selected: false },
];

const SEND_AMOUNT = 0.006; // BTC
const FEE_PER_INPUT = 0.0002; // BTC per input

export function ChapterUTXOAssignment({ assignmentId }: ChapterUTXOAssignmentProps) {
  const { profile, isAuthenticated } = useAuth();
  const { isAuthenticated: isAdminAuth, email: adminEmail, loading: adminLoading } = useSession('admin');
  
  const [utxos, setUtxos] = useState<UTXO[]>(UTXOS);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

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
      if (!response.ok) {
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
            setSelectedAnswer(answerData.selectedAnswer || null);
            setShowExplanation(true);
          } catch (e) {
            // Legacy format, ignore
          }
        }
      }
    } catch (err) {
      console.error('Error checking submission status:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUTXO = (id: 'A' | 'B' | 'C') => {
    if (submitted) return; // Can't change after submission
    
    setUtxos(prev => prev.map(utxo => 
      utxo.id === id ? { ...utxo, selected: !utxo.selected } : utxo
    ));
  };

  const getSelectedUTXOs = () => {
    return utxos.filter(u => u.selected);
  };

  const getTotalInput = () => {
    return getSelectedUTXOs().reduce((sum, utxo) => sum + utxo.amount, 0);
  };

  const getFee = () => {
    return getSelectedUTXOs().length * FEE_PER_INPUT;
  };

  const getChange = () => {
    const totalInput = getTotalInput();
    const fee = getFee();
    const change = totalInput - SEND_AMOUNT - fee;
    return change >= 0 ? change : 0;
  };

  const getAnswerOption = (): string | null => {
    const selected = getSelectedUTXOs();
    const selectedIds = selected.map(u => u.id).sort().join('+');
    
    if (selectedIds === 'A') return 'A';
    if (selectedIds === 'B+C') return 'B+C';
    if (selectedIds === 'A+C') return 'A+C';
    if (selectedIds === 'A+B+C') return 'A+B+C';
    return null;
  };

  const isCorrectAnswer = (answer: string): boolean => {
    return answer === 'B+C';
  };

  const handleSubmit = async () => {
    const email = isAdminAuth && adminEmail ? adminEmail : profile?.email;
    if ((!isAuthenticated && !isAdminAuth) || !email) {
      setError('Please log in to submit your assignment.');
      return;
    }

    const selected = getSelectedUTXOs();
    if (selected.length === 0) {
      setError('Please select at least one UTXO.');
      return;
    }

    const answer = getAnswerOption();
    if (!answer) {
      setError('Please select a valid combination of UTXOs.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSelectedAnswer(answer);

    try {
      const answerData = {
        selectedAnswer: answer,
        selectedUTXOs: selected.map(u => u.id),
        totalInput: getTotalInput(),
        fee: getFee(),
        change: getChange(),
        isCorrect: isCorrectAnswer(answer),
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
      setShowExplanation(true);
    } catch (err: any) {
      console.error('Error submitting assignment:', err);
      setError(err.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getExplanation = (answer: string) => {
    switch (answer) {
      case 'B+C':
        return {
          title: '✅ Correct Answer!',
          explanation: 'UTXO B + UTXO C (0.004 + 0.002 = 0.006 BTC)',
          reasons: [
            'Total input: 0.006 BTC (exact match - no change needed)',
            'Smallest transaction size (2 inputs, 2 outputs)',
            'Most efficient fee usage (0.0004 BTC total fee)',
            'No unnecessary change output',
          ],
          whyCorrect: 'This is the optimal choice because it uses exactly the amount needed without creating change, resulting in the smallest transaction size and lowest fees.',
        };
      case 'A':
        return {
          title: '❌ Not Optimal',
          explanation: 'UTXO A only (0.010 BTC)',
          reasons: [
            'Requires change output (0.010 - 0.006 - 0.0002 = 0.0038 BTC change)',
            'Larger transaction size (1 input, 2 outputs)',
            'Creates unnecessary change UTXO',
            'Higher privacy risk (uses large UTXO)',
          ],
          whyCorrect: 'While this works, it requires a change output which increases transaction size and fees. It\'s better to use smaller UTXOs that match the payment amount more closely.',
        };
      case 'A+C':
        return {
          title: '❌ Overkill',
          explanation: 'UTXO A + UTXO C (0.010 + 0.002 = 0.012 BTC)',
          reasons: [
            'More than needed (0.012 BTC for 0.006 BTC payment)',
            'Requires change output (0.012 - 0.006 - 0.0004 = 0.0056 BTC change)',
            'Larger transaction size (2 inputs, 2 outputs)',
            'Unnecessary fee (0.0004 BTC vs optimal 0.0004 BTC, but with change)',
          ],
          whyCorrect: 'This combination is overkill - it uses more inputs than necessary and creates a change output, resulting in a larger transaction than needed.',
        };
      case 'A+B+C':
        return {
          title: '❌ Worst Choice',
          explanation: 'All three UTXOs (0.010 + 0.004 + 0.002 = 0.016 BTC)',
          reasons: [
            'Too many inputs (3 inputs, 2 outputs)',
            'Highest fees (0.0006 BTC total fee)',
            'Requires change output (0.016 - 0.006 - 0.0006 = 0.0094 BTC change)',
            'Privacy loss (combines multiple UTXOs unnecessarily)',
            'Largest transaction size',
          ],
          whyCorrect: 'Using all three UTXOs is the worst choice because it maximizes fees, creates unnecessary change, and reduces privacy by combining too many inputs.',
        };
      default:
        return null;
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

  const selectedUTXOs = getSelectedUTXOs();
  const totalInput = getTotalInput();
  const fee = getFee();
  const change = getChange();
  const explanation = selectedAnswer ? getExplanation(selectedAnswer) : null;
  const isCorrect = selectedAnswer ? isCorrectAnswer(selectedAnswer) : false;

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 p-5 shadow-inner space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">Assignment: Choose the Correct UTXOs</h3>
        <p className="text-sm text-zinc-400 mb-4">
          Interactive exercise | Reward: TBD (after instructor review)
        </p>
      </div>

      {/* Scenario */}
      <div className="space-y-3 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
        <h4 className="text-base font-semibold text-zinc-200">Scenario</h4>
        <p className="text-sm text-zinc-300">
          You have the following UTXOs in your wallet. You want to send <strong className="text-cyan-400">{SEND_AMOUNT} BTC</strong> to someone.
        </p>
        <p className="text-xs text-zinc-400">
          Transaction fee (simplified): <strong>{FEE_PER_INPUT} BTC</strong> per input
        </p>
      </div>

      {submitted && submissionStatus ? (
        <div className="space-y-4">
          <div className={`p-4 border rounded-lg ${
            isCorrect 
              ? 'bg-green-900/20 border-green-800/50' 
              : 'bg-orange-900/20 border-orange-800/50'
          }`}>
            <p className={`font-medium mb-2 ${
              isCorrect ? 'text-green-200' : 'text-orange-200'
            }`}>
              {explanation?.title || 'Assignment Submitted'}
            </p>
            {submissionStatus.status === 'graded' && submissionStatus.is_correct && (
              <p className="text-sm text-green-300 font-medium">✓ Approved!</p>
            )}
          </div>

          {showExplanation && explanation && (
            <div className="space-y-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
              <div>
                <h4 className="text-sm font-semibold text-zinc-300 mb-2">Your Selection:</h4>
                <p className="text-zinc-200 font-mono">{explanation.explanation}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-zinc-300 mb-2">Analysis:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-zinc-300">
                  {explanation.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-zinc-800/50 rounded border border-zinc-700/50">
                <h4 className="text-sm font-semibold text-zinc-300 mb-2">Why this choice:</h4>
                <p className="text-sm text-zinc-300">{explanation.whyCorrect}</p>
              </div>

              {selectedAnswer && (
                <div className="grid grid-cols-3 gap-4 p-3 bg-zinc-800/50 rounded border border-zinc-700/50">
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">Total Input</p>
                    <p className="text-sm font-mono text-zinc-200">{totalInput.toFixed(4)} BTC</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">Fee</p>
                    <p className="text-sm font-mono text-zinc-200">{fee.toFixed(4)} BTC</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">Change</p>
                    <p className="text-sm font-mono text-zinc-200">{change.toFixed(4)} BTC</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* UTXO Selection */}
          <div className="space-y-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
            <h4 className="text-base font-semibold text-zinc-200">Your UTXOs (Click to Select)</h4>
            <div className="grid grid-cols-3 gap-4">
              {utxos.map((utxo) => (
                <button
                  key={utxo.id}
                  type="button"
                  onClick={() => toggleUTXO(utxo.id)}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    utxo.selected
                      ? 'bg-orange-500/20 border-orange-500/50 shadow-lg shadow-orange-500/20'
                      : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Lock className={`w-6 h-6 ${
                      utxo.selected ? 'text-orange-400' : 'text-zinc-500'
                    }`} />
                    <div className="text-center">
                      <p className={`text-xs font-medium ${
                        utxo.selected ? 'text-orange-300' : 'text-zinc-400'
                      }`}>
                        UTXO {utxo.id}
                      </p>
                      <p className={`text-lg font-mono font-bold ${
                        utxo.selected ? 'text-orange-200' : 'text-zinc-300'
                      }`}>
                        {utxo.amount.toFixed(3)} BTC
                      </p>
                    </div>
                  </div>
                  {utxo.selected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-black font-bold">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Selection Summary */}
          {selectedUTXOs.length > 0 && (
            <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
              <h4 className="text-sm font-semibold text-zinc-300 mb-3">Selection Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-zinc-400 mb-1">Selected UTXOs</p>
                  <p className="text-sm font-mono text-zinc-200">
                    {selectedUTXOs.map(u => u.id).join(' + ') || 'None'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 mb-1">Total Input</p>
                  <p className="text-sm font-mono text-zinc-200">{totalInput.toFixed(4)} BTC</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 mb-1">Fee ({selectedUTXOs.length} inputs)</p>
                  <p className="text-sm font-mono text-zinc-200">{fee.toFixed(4)} BTC</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 mb-1">Change Output</p>
                  <p className={`text-sm font-mono ${
                    change > 0 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {change.toFixed(4)} BTC {change > 0 ? '(change)' : '(no change)'}
                  </p>
                </div>
              </div>
              
              {totalInput - fee < SEND_AMOUNT && (
                <div className="mt-3 p-2 bg-red-900/20 border border-red-800/50 rounded">
                  <p className="text-xs text-red-300">
                    ⚠️ Insufficient funds: {totalInput.toFixed(4)} BTC input - {fee.toFixed(4)} BTC fee = {(totalInput - fee).toFixed(4)} BTC available (need {SEND_AMOUNT.toFixed(4)} BTC)
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || selectedUTXOs.length === 0 || (totalInput - fee < SEND_AMOUNT)}
            className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-orange-500 px-6 py-3 font-semibold text-black transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Assignment'}
          </button>
        </div>
      )}
    </div>
  );
}



