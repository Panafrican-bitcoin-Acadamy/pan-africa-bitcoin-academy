'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const DURATION_MS = 2000;

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

interface ImpactStatsCountUpProps {
  studentsTrained: number;
  satsRewarded: number;
  countriesRepresented: number;
}

export function ImpactStatsCountUp({
  studentsTrained,
  satsRewarded,
  countriesRepresented,
}: ImpactStatsCountUpProps) {
  const [displayStudents, setDisplayStudents] = useState(0);
  const [displaySatsK, setDisplaySatsK] = useState(0);
  const [displayCountries, setDisplayCountries] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const satsK = Math.floor(satsRewarded / 1000);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const h = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimated) return;
        setHasAnimated(true);
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayStudents(studentsTrained);
      setDisplaySatsK(satsK);
      setDisplayCountries(countriesRepresented);
      return;
    }
    if (!hasAnimated) return;

    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / DURATION_MS, 1);
      const eased = easeOutQuart(t);

      setDisplayStudents(Math.round(eased * studentsTrained));
      setDisplaySatsK(Math.round(eased * satsK));
      setDisplayCountries(Math.round(eased * countriesRepresented));

      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [hasAnimated, prefersReducedMotion, studentsTrained, satsK, countriesRepresented]);

  return (
    <section
      ref={sectionRef}
      className="mb-32 rounded-2xl border border-orange-500/20 bg-gradient-to-b from-zinc-900/95 to-black/90 p-8 sm:p-12 shadow-[0_0_40px_rgba(249,115,22,0.1)] ring-1 ring-orange-400/5"
    >
      <div className="flex flex-col items-center text-center">
        <h2 className="mb-4 text-3xl font-semibold text-orange-200 sm:text-4xl lg:text-5xl">
          Our Impact
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-base text-zinc-400 sm:text-lg">
          Real numbers from our Bitcoin education programs across Africa.
        </p>

        <div className="grid w-full max-w-4xl gap-8 sm:grid-cols-3 sm:gap-10">
          <div className="flex flex-col items-center text-center">
            <div className="text-5xl font-bold text-orange-400 sm:text-6xl tabular-nums">
              {displayStudents}
            </div>
            <div className="mt-3 text-base text-zinc-400">Students trained</div>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="text-5xl font-bold text-orange-400 sm:text-6xl tabular-nums">
              {displaySatsK}K+
            </div>
            <div className="mt-3 text-base text-zinc-400">Sats rewarded</div>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="text-5xl font-bold text-orange-400 sm:text-6xl tabular-nums">
              {displayCountries}
            </div>
            <div className="mt-3 text-base text-zinc-400">Countries represented</div>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/impact"
            className="inline-flex items-center justify-center rounded-xl border border-orange-400/40 bg-orange-500/10 px-6 py-3.5 text-base font-semibold text-orange-300 transition hover:bg-orange-500/20 hover:border-orange-400/60"
          >
            See Our Impact Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
