'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const BASE_YEAR = 1971;
const MAX_YEAR = 2025;
const BASE_AMOUNT = 100000;
const LOCAL_STORAGE_KEY = 'inflationYear';
const INFLATION_ENABLED_KEY = 'inflationTrackerEnabled';
const YEARS_PER_LOGIN = 5;
const LOGIN_COUNTED_SESSION_KEY = 'inflationLoginCounted';

// CPI anchors (US city average) used for interpolation across years.
const CPI_POINTS: Record<number, number> = {
  1971: 40.5,
  1975: 53.8,
  1980: 82.4,
  1985: 107.6,
  1990: 130.7,
  1995: 152.4,
  2000: 172.2,
  2005: 195.3,
  2010: 218.1,
  2015: 237.0,
  2020: 258.8,
  2025: 310.0,
};

type LifestyleItemId = 'house' | 'cars' | 'food' | 'child' | 'transport' | 'misc';
type LifestyleState = 'full' | 'gone';
type InflationCategory = 'housing' | 'cars' | 'food' | 'childcare' | 'transport' | 'other';

const BASE_LIFESTYLE_BUDGET: Array<{
  id: LifestyleItemId;
  label: string;
  cost: number;
  category: InflationCategory;
}> = [
  { id: 'house', label: 'House', cost: 50000, category: 'housing' },
  { id: 'cars', label: '2 Cars', cost: 20000, category: 'cars' },
  { id: 'food', label: 'Food (5 yrs)', cost: 10000, category: 'food' },
  { id: 'child', label: 'Child expenses', cost: 10000, category: 'childcare' },
  { id: 'transport', label: 'Fuel & transport', cost: 5000, category: 'transport' },
  { id: 'misc', label: 'Other', cost: 5000, category: 'other' },
];

const DEFAULT_PRIORITY_ORDER: LifestyleItemId[] = BASE_LIFESTYLE_BUDGET.map((i) => i.id);
const PRIORITY_ORDER_STORAGE_KEY = 'inflationPriorityOrder';

// Category sensitivity relative to CPI. >1 means category usually rises faster than headline CPI.
const CATEGORY_INFLATION_SENSITIVITY: Record<InflationCategory, number> = {
  housing: 1.18,
  cars: 1.03,
  food: 1.1,
  childcare: 1.16,
  transport: 1.08,
  other: 1.0,
};

function isLifestyleItemId(value: unknown): value is LifestyleItemId {
  return typeof value === 'string' && DEFAULT_PRIORITY_ORDER.includes(value as LifestyleItemId);
}

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

function getInflatedItemCost(baseCost: number, category: InflationCategory, year: number): number {
  const cpiStart = CPI_POINTS[BASE_YEAR];
  const cpiCurrent = interpolateByYear(CPI_POINTS, year);
  const cpiRatio = cpiCurrent / cpiStart;
  const sensitivity = CATEGORY_INFLATION_SENSITIVITY[category] ?? 1;
  return baseCost * Math.pow(cpiRatio, sensitivity);
}

function getLifestyleStates(
  currentBudget: number,
  priorityOrder: LifestyleItemId[],
  year: number
): Array<{ id: LifestyleItemId; label: string; cost: number; state: LifestyleState }> {
  let remaining = currentBudget;
  const byId = new Map(BASE_LIFESTYLE_BUDGET.map((i) => [i.id, i]));

  return priorityOrder.map((id) => {
    const item = byId.get(id);
    if (!item) {
      return { id, label: String(id), cost: 0, state: 'gone' as const };
    }

    const currentCost = getInflatedItemCost(item.cost, item.category, year);

    if (remaining >= currentCost) {
      remaining -= currentCost;
      return { ...item, cost: currentCost, state: 'full' as const };
    }
    return { ...item, cost: currentCost, state: 'gone' as const };
  });
}

export function InflationTrackerWidget() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(BASE_YEAR);
  const [priorityOrder, setPriorityOrder] = useState<LifestyleItemId[]>(DEFAULT_PRIORITY_ORDER);
  const [hydrated, setHydrated] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [displayLifestyleBudget, setDisplayLifestyleBudget] = useState(BASE_AMOUNT);
  const prevLifestyleRef = useRef(BASE_AMOUNT);
  const dragIdRef = useRef<LifestyleItemId | null>(null);
  const trackerRef = useRef<HTMLDivElement | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setHydrated(false);
      setTrackingEnabled(false);
      try {
        sessionStorage.removeItem(LOGIN_COUNTED_SESSION_KEY);
      } catch {
        // ignore session storage errors
      }
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
          if (Array.isArray(parsed) && parsed.length === DEFAULT_PRIORITY_ORDER.length) {
            const casted = parsed.filter(isLifestyleItemId);
            if (casted.length === DEFAULT_PRIORITY_ORDER.length) setPriorityOrder(casted);
          }
        }
      } catch {
        // ignore storage parse errors
      }

      const savedYearRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const savedYear = savedYearRaw ? Number(savedYearRaw) : NaN;
      const safeYear = Number.isNaN(savedYear) ? BASE_YEAR : savedYear;

      // Advance once per authenticated session (login-based progression).
      let shouldAdvanceOnLogin = false;
      try {
        shouldAdvanceOnLogin = sessionStorage.getItem(LOGIN_COUNTED_SESSION_KEY) !== 'true';
      } catch {
        // If sessionStorage is unavailable, do not repeatedly advance.
        shouldAdvanceOnLogin = false;
      }

      const nextYear = shouldAdvanceOnLogin
        ? Math.min(MAX_YEAR, safeYear + YEARS_PER_LOGIN)
        : Math.min(Math.max(safeYear, BASE_YEAR), MAX_YEAR);

      localStorage.setItem(LOCAL_STORAGE_KEY, String(nextYear));
      try {
        sessionStorage.setItem(LOGIN_COUNTED_SESSION_KEY, 'true');
      } catch {
        // ignore session storage errors
      }
      setYear(nextYear);
    };

    refreshEnabledAndYear();

    const onEnabledChanged = () => refreshEnabledAndYear();
    window.addEventListener('inflationTrackerEnabledChanged', onEnabledChanged);

    return () => {
      window.removeEventListener('inflationTrackerEnabledChanged', onEnabledChanged);
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
    () => getLifestyleStates(lifestyleBudget, priorityOrder, year),
    [lifestyleBudget, priorityOrder, year]
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

  // Close the panel whenever user navigates to another page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close when clicking/focusing outside the widget.
  useEffect(() => {
    if (!open) return;

    const handleOutside = (event: MouseEvent | TouchEvent | FocusEvent) => {
      const root = trackerRef.current;
      const target = event.target as Node | null;
      if (!root || !target) return;
      if (!root.contains(target)) setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('focusin', handleOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('focusin', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  if (authLoading || !isAuthenticated || !hydrated) return null;

  return (
    <div ref={trackerRef} className="fixed right-0 top-1/2 z-40 -translate-y-1/2">
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
                <span
                  className={`text-[11px] font-semibold ${
                    trackingEnabled ? 'text-green-400' : 'text-zinc-400'
                  }`}
                >
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
                  <div className="space-y-1">
                    {lifestyleStates.map((item, idx) => {
                      return (
                        <div key={item.id}>
                          <div
                            className={`h-3 rounded transition ${
                              dropIndex === idx ? 'bg-orange-400/40' : 'bg-transparent'
                            }`}
                            onDragOver={(e) => {
                              if (!dragIdRef.current) return;
                              e.preventDefault();
                              setDropIndex(idx);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              const fromId = dragIdRef.current;
                              dragIdRef.current = null;
                              setDropIndex(null);
                              if (!fromId) return;

                              setPriorityOrder((prev) => {
                                const fromIndex = prev.indexOf(fromId);
                                if (fromIndex < 0) return prev;
                                const next = [...prev];
                                next.splice(fromIndex, 1);
                                const insertAt = idx > fromIndex ? idx - 1 : idx;
                                next.splice(insertAt, 0, fromId);
                                return next;
                              });
                            }}
                          />
                          <div
                            className={`flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 ${
                              item.state === 'full'
                                ? 'border-green-500/30 bg-green-500/10 text-green-200'
                                : 'border-zinc-700 bg-zinc-900/70 text-zinc-500 line-through'
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
                              setDropIndex(idx);
                            }}
                            onDragEnd={() => {
                              dragIdRef.current = null;
                              setDropIndex(null);
                            }}
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="text-[10px] text-zinc-400 select-none">↕</span>
                              <span className="text-xs font-medium truncate">{item.label}</span>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <span className="w-3 text-center text-xs">{item.state === 'full' ? '✔' : '✖'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div
                      className={`h-3 rounded transition ${
                        dropIndex === lifestyleStates.length ? 'bg-orange-400/40' : 'bg-transparent'
                      }`}
                      onDragOver={(e) => {
                        if (!dragIdRef.current) return;
                        e.preventDefault();
                        setDropIndex(lifestyleStates.length);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const fromId = dragIdRef.current;
                        dragIdRef.current = null;
                        setDropIndex(null);
                        if (!fromId) return;

                        setPriorityOrder((prev) => {
                          const fromIndex = prev.indexOf(fromId);
                          if (fromIndex < 0) return prev;
                          const next = [...prev];
                          next.splice(fromIndex, 1);
                          next.push(fromId);
                          return next;
                        });
                      }}
                    />
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

