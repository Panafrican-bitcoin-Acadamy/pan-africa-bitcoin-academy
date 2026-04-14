'use client';

import { useState, useRef } from 'react';
import { Star } from 'lucide-react';
import { usePathname } from 'next/navigation';

const MAX_COMMENT = 2000;

export function SiteFeedback() {
  const pathname = usePathname() || '/';
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const honeypotRef = useRef<HTMLInputElement>(null);

  const displayStars = hoverRating ?? rating ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating == null || rating < 1) {
      setStatus('error');
      setMessage('Choose a star rating first.');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
          page_path: pathname,
          website: honeypotRef.current?.value ?? '',
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Thanks!');
        setRating(null);
        setComment('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <section className="w-full border-t border-cyan-400/10 bg-gradient-to-b from-black/60 to-black/90">
      <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-9">
        {status === 'success' ? (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-green-500/10 px-4 py-2.5 ring-1 ring-green-500/20">
            <svg className="h-4 w-4 shrink-0 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className="text-sm text-green-400">{message}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input ref={honeypotRef} type="text" name="website" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden />

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <Star className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/90" strokeWidth={2} aria-hidden />
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-zinc-100 sm:text-[1.05rem]">Rate your experience</h2>
                  <p className="mt-1 text-[0.9375rem] font-medium leading-snug text-zinc-200 sm:text-base">
                    ከመይ ረኺብኩማ ሓሳብኩም ሃቡና
                  </p>
                </div>
              </div>
              <div
                className="flex items-center gap-0.5"
                role="group"
                aria-label="Star rating"
                onMouseLeave={() => setHoverRating(null)}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="rounded p-0.5 text-amber-400 transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
                    aria-label={`${n} star${n === 1 ? '' : 's'}`}
                    aria-pressed={rating === n}
                    onMouseEnter={() => setHoverRating(n)}
                    onClick={() => {
                      setRating(n);
                      if (status === 'error') setStatus('idle');
                    }}
                  >
                    <Star
                      className={`h-6 w-6 ${n <= displayStars ? 'fill-amber-400 text-amber-300' : 'fill-zinc-800 text-zinc-600'}`}
                      strokeWidth={1.2}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="site-feedback-comment" className="sr-only">
                Optional comment
              </label>
              <textarea
                id="site-feedback-comment"
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value.slice(0, MAX_COMMENT));
                  if (status === 'error') setStatus('idle');
                }}
                rows={2}
                placeholder="Optional comment…"
                className="w-full resize-none rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-3 py-2 text-sm leading-snug text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 sm:text-[13px]"
              />
              <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-zinc-600">
                <span>Private — we read feedback to improve the site.</span>
                <span className="tabular-nums">{comment.length}/{MAX_COMMENT}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={status === 'loading'}
                className="rounded-lg bg-gradient-to-r from-orange-500 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === 'loading' ? 'Submitting…' : 'Submit feedback'}
              </button>
              {status === 'error' && <span className="text-xs text-red-400">{message}</span>}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
