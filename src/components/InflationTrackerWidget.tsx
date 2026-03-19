'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const BASE_YEAR = 1971;
const MAX_YEAR = 2025;
const BASE_AMOUNT = 100000;
const LOCAL_STORAGE_KEY = 'inflationYear';
const INFLATION_ENABLED_KEY = 'inflationTrackerEnabled';
const LAST_COUNT_AT_KEY = 'inflationLastCountAt';
const YEARS_PER_INTERVAL = 2;
const ADVANCE_INTERVAL_MS = 1000 * 60 * 60 * 24 * 30; // advance +2 years every ~30 days of real time

const CPI_POINTS: Record<number, number> = {
  1971: 40.5,
  1980: 82.4,
  1990: 130.7,
  2000: 172.2,
  2010: 218.1,
  2020: 258.8,
  2025: 310.0,
};

// (Left in for future extensions; the lifestyle model uses fixed 1971 lifestyle basket costs.)

type LifestyleItemId = 'house' | 'cars' | 'food' | 'child' | 'transport' | 'misc';
type LifestyleState = 'full' | 'gone';

const BASE_LIFESTYLE_BUDGET: Array<{ id: LifestyleItemId; label: string; cost: number }> = [
  { id: 'house', label: 'House', cost: 50000 },
  { id: 'cars', label: '2 Cars', cost: 20000 },
  { id: 'food', label: 'Food (5 yrs)', cost: 10000 },
  { id: 'child', label: 'Child expenses', cost: 10000 },
  { id: 'transport', label: 'Fuel & transport', cost: 5000 },
  { id: 'misc', label: 'Other', cost: 5000 },
];

const DEFAULT_PRIORITY_ORDER: LifestyleItemId[] = BASE_LIFESTYLE_BUDGET.map((i) => i.id);
const PRIORITY_ORDER_STORAGE_KEY = 'inflationPriorityOrder';

// Simplified BTC average yearly price points (USD)
const BTC_POINTS: Record<number, number> = {
  2011: 5,
  2013: 189,
  2015: 272,
  2017: 4000,
  2020: 11111,
  2021: 47686,
  2023: 28966,
  2024: 60000,
  2025: 75000,
};

function interpolateByYear(points: Record<number, number>, year: number): number {
  const sortedYears = Object.keys(points).map(Number).sort((a, b) => a - b);
  if (year <= sortedYears[0]) return points[sortedYears[0]];
  if (year >= sortedYears[sortedYears.length - 1]) return points[sortedYears[sortedYears.length - 1]];

  for (let i = 0; i < sortedYears.length - 1; i++) {
    const startYear = sortedYears[i];
    const endYear = sortedYears[i + 1];
    if (year >= startYear && year <= endYear) {
      const ratio = (year - startYear) / (endYear - startYear);
      return points[startYear] + (points[endYear] - points[startYear]) * ratio;
    }
  }
  return points[sortedYears[0]];
}

function adjustedForInflation(year: number): number {
  const cpiStart = CPI_POINTS[BASE_YEAR];
  const cpiCurrent = interpolateByYear(CPI_POINTS, year);
  return BASE_AMOUNT * (cpiCurrent / cpiStart);
}

function getLifestyleStates(
  currentBudget: number,
  priorityOrder: LifestyleItemId[]
): Array<{ id: LifestyleItemId; label: string; cost: number; state: LifestyleState }> {
  let remaining = currentBudget;
  const byId = new Map(BASE_LIFESTYLE_BUDGET.map((i) => [i.id, i]));

  return priorityOrder.map((id) => {
    const item = byId.get(id);
    if (!item) {
      return { id, label: String(id), cost: 0, state: 'gone' as const };
    }

    if (remaining >= item.cost) {
      remaining -= item.cost;
      return { ...item, state: 'full' as const };
    }
    return { ...item, state: 'gone' as const };
  });
}

export function InflationTrackerWidget() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(BASE_YEAR);
  const [priorityOrder, setPriorityOrder] = useState<LifestyleItemId[]>(DEFAULT_PRIORITY_ORDER);
  const [hydrated, setHydrated] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [displayLifestyleBudget, setDisplayLifestyleBudget] = useState(BASE_AMOUNT);
  const prevLifestyleRef = useRef(BASE_AMOUNT);
  const dragIdRef = useRef<LifestyleItemId | null>(null);
  const [dragOver, setDragOver] = useState<{ id: LifestyleItemId; position: 'before' | 'after' } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setHydrated(false);
      setTrackingEnabled(false);
      return;
    }

    setHydrated(true);

    const refreshEnabledAndYear = () => {
      const enabled = localStorage.getItem(INFLATION_ENABLED_KEY) === 'true';
      setTrackingEnabled(enabled);
      if (!enabled) return;

      // Priority order (optional)
      try {
        const savedPriorityRaw = localStorage.getItem(PRIORITY_ORDER_STORAGE_KEY);
        if (savedPriorityRaw) {
          const parsed = JSON.parse(savedPriorityRaw) as unknown;
          const validIds = new Set(DEFAULT_PRIORITY_ORDER);
          if (Array.isArray(parsed) && parsed.length === DEFAULT_PRIORITY_ORDER.length) {
            const casted = parsed.filter((x) => typeof x === 'string' && validIds.has(x)) as LifestyleItemId[];
            if (casted.length === DEFAULT_PRIORITY_ORDER.length) setPriorityOrder(casted);
          }
        }
      } catch {
        // ignore storage parse errors
      }

      const savedYearRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const savedYear = savedYearRaw ? Number(savedYearRaw) : NaN;
      const lastCountAtRaw = localStorage.getItem(LAST_COUNT_AT_KEY);
      const lastCountAt = lastCountAtRaw ? Number(lastCountAtRaw) : NaN;
      const now = Date.now();

      const safeYear = Number.isNaN(savedYear) ? BASE_YEAR : savedYear;
      const safeLastCountAt = Number.isNaN(lastCountAt) ? now : lastCountAt;

      const elapsed = Math.max(0, now - safeLastCountAt);
      const intervals = Math.floor(elapsed / ADVANCE_INTERVAL_MS);
      const advancedYear = Math.min(MAX_YEAR, safeYear + intervals * YEARS_PER_INTERVAL);
      const newLastCountAt = intervals > 0 ? safeLastCountAt + intervals * ADVANCE_INTERVAL_MS : safeLastCountAt;

      localStorage.setItem(LOCAL_STORAGE_KEY, String(advancedYear));
      localStorage.setItem(LAST_COUNT_AT_KEY, String(newLastCountAt));
      setYear(Math.min(Math.max(advancedYear, BASE_YEAR), MAX_YEAR));
    };

    refreshEnabledAndYear();

    const onEnabledChanged = () => refreshEnabledAndYear();
    window.addEventListener('inflationTrackerEnabledChanged', onEnabledChanged);
    const intervalId = window.setInterval(() => {
      // Keep year in sync while the tab stays open.
      refreshEnabledAndYear();
    }, 60 * 1000);

    return () => {
      window.removeEventListener('inflationTrackerEnabledChanged', onEnabledChanged);
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, authLoading]);

  const adjustedValue = useMemo(() => adjustedForInflation(year), [year]);
  // Inverse CPI to show purchasing power decline over time.
  const lifestyleBudget = useMemo(() => {
    const cpiStart = CPI_POINTS[BASE_YEAR];
    const cpiCurrent = interpolateByYear(CPI_POINTS, year);
    return BASE_AMOUNT * (cpiStart / cpiCurrent);
  }, [year]);
  const lifestyleStates = useMemo(
    () => getLifestyleStates(lifestyleBudget, priorityOrder),
    [lifestyleBudget, priorityOrder]
  );

  const btcPrice = useMemo(() => {
    const firstBtcYear = Math.min(...Object.keys(BTC_POINTS).map(Number));
    if (year < firstBtcYear) return null;
    return interpolateByYear(BTC_POINTS, year);
  }, [year]);
  const btcEquivalent = btcPrice ? adjustedValue / btcPrice : null;
  const btcTodayPrice = BTC_POINTS[MAX_YEAR];
  const btcValueAtTodayPrice = btcEquivalent ? btcEquivalent * btcTodayPrice : null;
  const btcVsCashMultiple = btcValueAtTodayPrice ? btcValueAtTodayPrice / lifestyleBudget : null;

  useEffect(() => {
    const startLifestyle = prevLifestyleRef.current;
    const targetLifestyle = lifestyleBudget;
    const duration = 450;
    let raf = 0;
    let startTime = 0;

    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      // Ease-out cubic for smoother feel
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayLifestyleBudget(startLifestyle + (targetLifestyle - startLifestyle) * eased);

      if (progress < 1) {
        raf = window.requestAnimationFrame(tick);
      } else {
        prevLifestyleRef.current = targetLifestyle;
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [lifestyleBudget]);

  useEffect(() => {
    if (!hydrated || !trackingEnabled) return;
    localStorage.setItem(LOCAL_STORAGE_KEY, String(year));
  }, [year, hydrated, trackingEnabled]);

  useEffect(() => {
    if (!hydrated || !trackingEnabled) return;
    localStorage.setItem(PRIORITY_ORDER_STORAGE_KEY, JSON.stringify(priorityOrder));
  }, [priorityOrder, hydrated, trackingEnabled]);

  if (authLoading || !isAuthenticated || !hydrated) return null;

  const movePriority = (id: LifestyleItemId, delta: number) => {
    setPriorityOrder((prev) => {
      const fromIndex = prev.indexOf(id);
      if (fromIndex < 0) return prev;
      const toIndex = fromIndex + delta;
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      const next = [...prev];
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, id);
      return next;
    });
  };

  return (
    <div className="fixed right-0 top-1/2 z-40 -translate-y-1/2">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="hidden sm:flex h-11 w-11 items-center justify-center rounded-full border border-orange-400/40 bg-black/85 shadow-[0_0_20px_rgba(249,115,22,0.2)] transition hover:bg-black"
          aria-label={open ? 'Close inflation tracker' : 'Open inflation tracker'}
          title="Inflation Tracker"
        >
          <TrendingDown className="h-4 w-4 text-orange-300" />
        </button>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="sm:hidden group rounded-l-lg border border-r-0 border-orange-400/40 bg-black/85 px-2 py-4 text-xs font-semibold tracking-wide text-orange-300 shadow-[0_0_20px_rgba(249,115,22,0.2)] transition hover:bg-black"
          aria-label={open ? 'Close purchasing power tracker' : 'Open purchasing power tracker'}
          title="Purchasing Power Tracker"
        >
          <span className="flex items-center gap-1 [writing-mode:vertical-rl]">
            {open ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            Inflation
          </span>
        </button>

        <div
          className={`overflow-hidden border border-orange-400/30 bg-zinc-950/95 shadow-[0_0_30px_rgba(249,115,22,0.25)] transition-all duration-300 ${
            open ? 'w-[320px] p-4' : 'w-0 p-0 border-l-0 border-r-0'
          }`}
        >
          {open && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold text-orange-200">
                  <TrendingDown className="h-4 w-4" />
                  Purchasing Power Tracker
                </h3>
                <span className="text-[11px] font-semibold text-zinc-400">
                  {trackingEnabled ? 'Tracking ON' : 'Start in Dashboard'}
                </span>
              </div>

              <p className="text-zinc-400">
                Year: <strong className="text-zinc-200">{year}</strong>
              </p>

              {!trackingEnabled ? (
                <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-zinc-300">
                  <p className="text-zinc-200">Start counting from your Dashboard.</p>
                  <p className="text-[11px] text-zinc-500">
                    After you start, this widget will follow you on every page and keep updating over time.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-zinc-300">
                  <p>
                    1971 lifestyle budget:{' '}
                    <strong className="text-orange-200">${BASE_AMOUNT.toLocaleString()}</strong>
                  </p>
                  <div className="space-y-1.5">
                    {lifestyleStates.map((item, idx) => {
                      const isBefore = dragOver?.id === item.id && dragOver.position === 'before';
                      const isAfter = dragOver?.id === item.id && dragOver.position === 'after';
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 ${
                            item.state === 'full'
                              ? 'border-green-500/30 bg-green-500/10 text-green-200'
                              : 'border-zinc-700 bg-zinc-900/70 text-zinc-500 line-through'
                          } ${isBefore ? 'border-t-2 border-orange-400/60' : ''} ${
                            isAfter ? 'border-b-2 border-orange-400/60' : ''
                          } cursor-grab`}
                          draggable
                          onDragStart={(e) => {
                            dragIdRef.current = item.id;
                            try {
                              e.dataTransfer.setData('text/plain', item.id);
                            } catch {
                              // ignore
                            }
                            e.dataTransfer.effectAllowed = 'move';
                            setDragOver(null);
                          }}
                          onDragOver={(e) => {
                            const fromId = dragIdRef.current;
                            if (!fromId || fromId === item.id) return;
                            e.preventDefault();

                            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                            const midpoint = rect.top + rect.height / 2;
                            const position = e.clientY < midpoint ? 'before' : 'after';
                            setDragOver({ id: item.id, position });
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const fromId = dragIdRef.current;
                            const toId = item.id;
                            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                            const midpoint = rect.top + rect.height / 2;
                            const position = e.clientY < midpoint ? 'before' : 'after';

                            dragIdRef.current = null;
                            setDragOver(null);

                            if (!fromId || fromId === toId) return;

                            setPriorityOrder((prev) => {
                              const fromIndex = prev.indexOf(fromId);
                              if (fromIndex < 0) return prev;

                              const next = [...prev];
                              next.splice(fromIndex, 1);

                              const remainingIndex = next.indexOf(toId);
                              if (remainingIndex < 0) return prev;

                              const insertIndex = position === 'before' ? remainingIndex : remainingIndex + 1;
                              next.splice(insertIndex, 0, fromId);
                              return next;
                            });
                          }}
                          onDragEnd={() => {
                            dragIdRef.current = null;
                            setDragOver(null);
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] text-zinc-400 select-none">↕</span>
                            <span className="text-xs font-medium truncate">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{item.state === 'full' ? '✔' : '✖'}</span>
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => movePriority(item.id, -1)}
                                className="h-4 w-5 rounded border border-zinc-800 bg-zinc-950/60 px-0.5 text-[10px] text-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-900"
                                aria-label={`Move ${item.label} up`}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                disabled={idx === lifestyleStates.length - 1}
                                onClick={() => movePriority(item.id, 1)}
                                className="h-4 w-5 rounded border border-zinc-800 bg-zinc-950/60 px-0.5 text-[10px] text-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-900"
                                aria-label={`Move ${item.label} down`}
                              >
                                ↓
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="pt-2 text-[11px] text-zinc-500">
                    Drag to reorder priorities. Items shown ✔ stay longer.
                  </p>

                  {btcPrice ? (
                    <div className="rounded-md border border-zinc-700 bg-zinc-900/60 p-2.5 text-xs text-zinc-300">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded border border-zinc-700 bg-zinc-950/70 p-2">
                          <div className="text-[10px] uppercase tracking-wide text-zinc-500">Cash ({year})</div>
                          <div className="mt-1 font-semibold text-zinc-200">${displayLifestyleBudget.toFixed(0)}</div>
                        </div>
                        <div className="rounded border border-orange-400/30 bg-orange-500/10 p-2">
                          <div className="text-[10px] uppercase tracking-wide text-orange-300">Bitcoin</div>
                          <div className="mt-1 font-semibold text-orange-200">{btcEquivalent?.toFixed(4)} BTC</div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between rounded border border-zinc-700 bg-zinc-950/70 p-2">
                        <div className="text-[10px] text-zinc-500">BTC @ {MAX_YEAR} (${btcTodayPrice.toFixed(0)})</div>
                        <div className="font-semibold text-cyan-300">${btcValueAtTodayPrice?.toFixed(0)}</div>
                      </div>
                      <div className="mt-2 text-center">
                        <span className="inline-flex items-center rounded-full border border-orange-400/30 bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-200">
                          {btcVsCashMultiple?.toFixed(2)}x
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded border border-zinc-700 bg-zinc-950/70 p-2 text-center text-zinc-400 text-xs">
                      BTC data starts at 2011
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

