'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';

interface Chapter14HalvingPuzzleProps {
  assignmentId: string;
}

const CORRECT_ORDER = ['50 BTC', '25 BTC', '12.5 BTC', '6.25 BTC', '3.125 BTC'];
const TILES = ['50 BTC', '25 BTC', '12.5 BTC', '6.25 BTC', '3.125 BTC'];

// Shuffle array function
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function Chapter14HalvingPuzzle({ assignmentId }: Chapter14HalvingPuzzleProps) {
  const { profile, isAuthenticated } = useAuth();
  const { isAuthenticated: isAdminAuth, email: adminEmail, loading: adminLoading } = useSession('admin');
  
  const [availableTiles, setAvailableTiles] = useState<string[]>([]);
  const [timelineSlots, setTimelineSlots] = useState<(string | null)[]>(Array(5).fill(null));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [universalMessage, setUniversalMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCorrect, setIsCorrect] = useState(false);

  // Initialize tiles on mount
  useEffect(() => {
    setAvailableTiles(shuffleArray(TILES));
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
      if (!email) return;
      
      const response = await fetch(`/api/assignments?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        const thisAssignment = data.assignments?.find((a: any) => a.id === assignmentId);
        if (thisAssignment?.submission) {
          setSubmissionStatus(thisAssignment.submission);
          setSubmitted(true);
          if (thisAssignment.submission.answer) {
            try {
              const answerData = JSON.parse(thisAssignment.submission.answer);
              if (answerData.timeline) {
                setTimelineSlots(answerData.timeline);
                checkCorrectness(answerData.timeline);
              }
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

  const checkCorrectness = (slots: (string | null)[]): boolean => {
    const filledSlots = slots.filter(s => s !== null) as string[];
    if (filledSlots.length !== CORRECT_ORDER.length) return false;
    
    const isCorrectOrder = filledSlots.every((tile, index) => tile === CORRECT_ORDER[index]);
    setIsCorrect(isCorrectOrder);
    return isCorrectOrder;
  };

  const getFeedbackForPlacement = (tile: string, slotIndex: number, currentSlots: (string | null)[]): string | null => {
    // Check if placing 25 BTC before 50 BTC
    if (tile === '25 BTC' && slotIndex === 0) {
      return "Bitcoin started at its highest reward. Scarcity is enforced over time, not retroactively.";
    }
    
    // Check if placing 12.5 BTC next to 50 BTC (skipping 25 BTC)
    if (tile === '12.5 BTC' && currentSlots[0] === '50 BTC' && slotIndex === 1) {
      return "Bitcoin never reduces gradually. Every reduction is exactly half.";
    }
    
    // Check if placing 3.125 BTC before 6.25 BTC
    if (tile === '3.125 BTC') {
      const sixPointTwoFiveIndex = currentSlots.findIndex(s => s === '6.25 BTC');
      if (sixPointTwoFiveIndex !== -1 && sixPointTwoFiveIndex > slotIndex) {
        return "Halvings happen in a fixed order. The future cannot arrive early.";
      }
    }

    return null;
  };

  const handleTileClick = (tileIndex: number) => {
    if (submitted) return;
    
    const tile = availableTiles[tileIndex];
    if (!tile) return;

    // Find first empty slot
    const emptySlotIndex = timelineSlots.findIndex(slot => slot === null);
    if (emptySlotIndex === -1) {
      setError('All slots are filled. Remove a tile first or submit your answer.');
      return;
    }

    // Get feedback for this placement
    const newSlots = [...timelineSlots];
    newSlots[emptySlotIndex] = tile;
    const placementFeedback = getFeedbackForPlacement(tile, emptySlotIndex, timelineSlots);
    
    if (placementFeedback) {
      setFeedback(placementFeedback);
    } else {
      setFeedback(null);
    }
    // Always show universal message when placing tiles
    setUniversalMessage("Bitcoin does not reduce gradually. It halves suddenly.");

    // Update slots and remove tile from available
    setTimelineSlots(newSlots);
    setAvailableTiles(availableTiles.filter((_, idx) => idx !== tileIndex));
    setError(null);
  };

  const handleSlotClick = (slotIndex: number) => {
    if (submitted) return;
    
    const tile = timelineSlots[slotIndex];
    if (!tile) return;

    // Return tile to available tiles (shuffled)
    setAvailableTiles(shuffleArray([...availableTiles, tile]));
    const newSlots = [...timelineSlots];
    newSlots[slotIndex] = null;
    setTimelineSlots(newSlots);
    setFeedback(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = isAdminAuth && adminEmail ? adminEmail : profile?.email;
    if ((!isAuthenticated && !isAdminAuth) || !email) {
      setError('Please log in to submit your assignment.');
      return;
    }

    // Check if all slots are filled
    if (timelineSlots.some(slot => slot === null)) {
      setError('Please fill all slots before submitting.');
      return;
    }

    const filledSlots = timelineSlots.filter(s => s !== null) as string[];
    const isCorrectAnswer = checkCorrectness(filledSlots);

    setSubmitting(true);
    setError(null);

    try {
      const answerData = {
        timeline: timelineSlots,
        isCorrect: isCorrectAnswer,
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
      setIsCorrect(isCorrectAnswer);
      
      if (!isCorrectAnswer) {
        setUniversalMessage("Bitcoin does not reduce gradually. It halves suddenly.");
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setAvailableTiles(shuffleArray(TILES));
    setTimelineSlots(Array(5).fill(null));
    setFeedback(null);
    setUniversalMessage(null);
    setError(null);
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

  const allSlotsFilled = timelineSlots.every(slot => slot !== null);

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 p-4 sm:p-5 shadow-inner space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-zinc-100 mb-2">🧩 The Halving Timeline Puzzle</h3>
        <p className="text-sm text-zinc-400 mb-3 sm:mb-4">
          Interactive exercise | Reward: TBD (after instructor review)
        </p>
        <div className="p-3 sm:p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg mb-3 sm:mb-4">
          <p className="text-sm text-orange-200 font-medium mb-2">Core rule (shown to students):</p>
          <p className="text-sm text-orange-100 leading-relaxed">
            Bitcoin's block reward does not decrease smoothly. It drops suddenly — like stairs, not a ramp.
          </p>
        </div>
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
              {isCorrect ? '✓ Correct! You understand Bitcoin\'s halving schedule.' : 'Assignment Submitted'}
            </p>
            {submissionStatus.status === 'graded' && submissionStatus.is_correct && (
              <p className="text-sm text-green-300 font-medium">✓ Approved!</p>
            )}
          </div>

          {!isCorrect && (
            <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
              <p className="text-sm text-orange-200 font-medium mb-2">Correct order:</p>
               <div className="flex items-center gap-2 flex-wrap">
                 {CORRECT_ORDER.map((tile, index) => (
                   <div key={index} className="px-3 py-2 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-400/40 rounded text-sm font-mono">
                     <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent font-bold">
                       {tile}
                     </span>
                     {index === 0 && <span className="ml-2 text-xs text-purple-300">→ Genesis</span>}
                     {index === 4 && <span className="ml-2 text-xs text-pink-300">→ Today</span>}
                   </div>
                 ))}
               </div>
              <p className="mt-4 text-sm text-zinc-300">
                This teaches: Fixed starting issuance, exact halving sequence, no skipping, no smoothing.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Timeline */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-sm sm:text-base font-semibold text-zinc-200 leading-tight">Timeline (Place tiles from left to right in chronological order)</h4>
            <div className="relative">
              {/* Timeline zones labels */}
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="text-xs sm:text-sm text-zinc-300 font-medium">[ Genesis ]</div>
                <div className="flex-1"></div>
                <div className="text-xs sm:text-sm text-zinc-300 font-medium">[ Today ]</div>
              </div>
              
              {/* Slots - Mobile-first: Stack on very small screens, horizontal on larger */}
              <div className="flex items-center gap-1.5 sm:gap-2 border-2 border-zinc-700 rounded-lg p-2 sm:p-4 bg-zinc-900/50 overflow-x-auto scrollbar-hide">
                {timelineSlots.map((tile, index) => (
                  <div
                    key={index}
                    onClick={() => handleSlotClick(index)}
                    className={`flex-1 min-w-[60px] sm:min-w-0 min-h-[80px] sm:min-h-[90px] border-2 rounded-lg p-2 sm:p-3 touch-target transition-all flex flex-col items-center justify-center active:scale-95 ${
                      tile 
                        ? 'border-2 border-transparent bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 active:from-indigo-500/30 active:via-purple-500/30 active:to-pink-500/30 active:border-indigo-400/50' 
                        : 'border-dashed border-zinc-600 bg-zinc-800/30 active:border-zinc-500'
                    }`}
                  >
                    {tile ? (
                      <>
                        <div className="text-sm sm:text-lg font-mono font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-1">{tile}</div>
                        {index === 0 && <div className="text-[10px] sm:text-xs text-purple-300 font-medium">Genesis</div>}
                        {index === 4 && <div className="text-[10px] sm:text-xs text-pink-300 font-medium">Today</div>}
                      </>
                    ) : (
                      <div className="text-center text-zinc-500 text-[10px] sm:text-xs">
                        Empty
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-400 mt-2 text-center leading-relaxed">
                Tap a slot to remove a tile and place it elsewhere
              </p>
            </div>
          </div>

          {/* Available Tiles */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-sm sm:text-base font-semibold text-zinc-200">Available Tiles (Tap to Place)</h4>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {availableTiles.map((tile, index) => (
                 <button
                   key={`${tile}-${index}`}
                   onClick={() => handleTileClick(index)}
                   className="px-4 py-3 min-h-[44px] bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 border-2 border-purple-400/50 rounded-lg text-sm sm:text-base font-mono font-bold text-white active:from-purple-500 active:via-blue-500 active:to-cyan-400 active:scale-95 transition-all touch-target"
                 >
                   {tile}
                 </button>
              ))}
            </div>
            {availableTiles.length === 0 && (
              <p className="text-sm text-zinc-400 italic">All tiles have been placed on the timeline.</p>
            )}
          </div>

          {/* Feedback */}
          {feedback && (
            <div className="p-3 sm:p-4 bg-orange-900/20 border border-orange-800/50 rounded-lg">
              <p className="text-sm text-orange-200 leading-relaxed">{feedback}</p>
            </div>
          )}

           {universalMessage && (
             <div className="p-3 sm:p-4 bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-pink-900/20 border border-indigo-700/50 rounded-lg">
               <p className="text-sm bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent font-medium leading-relaxed">{universalMessage}</p>
             </div>
           )}

          {error && (
            <div className="p-3 sm:p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
              <p className="text-sm text-red-200 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Submit Button - Mobile-first: Full width on mobile, side-by-side on larger screens */}
          <div className="flex flex-col sm:flex-row gap-3">
             <button
               type="submit"
               onClick={handleSubmit}
               disabled={!allSlotsFilled || submitting}
               className={`flex-1 min-h-[48px] px-6 py-3 rounded-lg text-base font-medium transition-all touch-target ${
                 allSlotsFilled && !submitting
                   ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white active:from-green-600 active:via-emerald-600 active:to-teal-600 active:scale-95 cursor-pointer'
                   : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
               }`}
             >
               {submitting ? 'Submitting...' : 'Submit Answer'}
             </button>
             <button
               type="button"
               onClick={handleReset}
               disabled={submitting}
               className="flex-1 sm:flex-initial min-h-[48px] px-6 py-3 rounded-lg text-base font-medium bg-gradient-to-r from-slate-600 via-zinc-600 to-slate-700 text-white active:from-slate-500 active:via-zinc-500 active:to-slate-600 active:scale-95 transition-all touch-target cursor-pointer disabled:cursor-not-allowed"
             >
               Reset
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

