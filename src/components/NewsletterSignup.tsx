'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatedHeading } from '@/components/AnimatedHeading';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setInView(true);
      return;
    }
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Successfully subscribed!');
        setEmail('');
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
    <section ref={sectionRef} className="w-full border-t border-cyan-400/10 bg-gradient-to-b from-black/60 to-black/90">
      <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20 text-center">
        {/* Icon — animates in first */}
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/15 to-cyan-500/15 ring-1 ring-cyan-500/20 transition-all duration-700 ease-out"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.95)',
          }}
        >
          <svg className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>

        <AnimatedHeading as="h2" className="text-2xl font-semibold text-zinc-50 sm:text-3xl">
          Stay in the Loop
        </AnimatedHeading>
        <p
          className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base transition-all duration-700 ease-out"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(12px)',
            transitionDelay: inView ? '120ms' : '0ms',
          }}
        >
          Get updates on new cohorts, chapters, events, and Bitcoin insights — straight to your inbox.
        </p>

        {status === 'success' ? (
          <div
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-green-500/10 px-6 py-3 ring-1 ring-green-500/25 transition-all duration-600 ease-out"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? 'translateY(0)' : 'translateY(10px)',
              transitionDelay: inView ? '200ms' : '0ms',
            }}
          >
            <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className="text-sm font-medium text-green-400">{message}</span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row transition-all duration-700 ease-out"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? 'translateY(0)' : 'translateY(12px)',
              transitionDelay: inView ? '200ms' : '0ms',
            }}
          >
            <div className="relative flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="shrink-0 rounded-xl bg-gradient-to-r from-orange-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(249,115,22,0.15)] transition-all hover:brightness-110 hover:shadow-[0_0_25px_rgba(249,115,22,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Subscribing...
                </span>
              ) : (
                'Subscribe'
              )}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="mt-3 text-xs text-red-400">{message}</p>
        )}

        <p
          className="mt-4 text-[11px] text-zinc-600 transition-all duration-600 ease-out"
          style={{
            opacity: inView ? 1 : 0,
            transitionDelay: inView ? '320ms' : '0ms',
          }}
        >
          No spam, ever. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
