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
const YEARS_PER_LOGIN = 4;
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
type LifestyleState = 'full' | 'partial' | 'gone';
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
  housing: 1.09,
  cars: 0.98,
  food: 1.05,
  childcare: 1.1,
  transport: 1.03,
  other: 1.0,
};

function isLifestyleItemId(value: unknown): value is LifestyleItemId {
  return typeof value === 'string' && DEFAULT_PRIORITY_ORDER.includes(value as LifestyleItemId);
}

/**
 * BTC/USD by calendar year: arithmetic mean of Blockchain.com “Market Price (USD)” samples
 * (consolidated major exchanges; chart resolves to ~1 point/week — not every tick).
 * API: https://api.blockchain.info/charts/market-price?timespan=all&format=json — group `values` by UTC year.
 * Recomputed in-repo when updating: mean of all y>0 points falling in each year.
 */
const BTC_POINTS: Record<number, number> = {
  2011: 5.99195652173913,
  2012: 8.464725274725275,
  2013: 186.3886813186813,
  2014: 524.9659782608696,
  2015: 272.36406593406593,
  2016: 562.5106593406593,
  2017: 3944.3,
  2018: 7531.742307692308,
  2019: 7346.870879120879,
  2020: 11157.897826086957,
  2021: 47258.09252747252,
  2022: 28262.354725274723,
  2023: 28692.46802197802,
  2024: 65828.22836956521,
  2025: 101922.68945054946,
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
      // Geometric interpolation better reflects compounding for CPI and BTC.
      return points[startYear] * Math.pow(points[endYear] / points[startYear], ratio);
    }
  }
  return points[sortedYears[0]];
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
): Array<{
  id: LifestyleItemId;
  label: string;
  cost: number;
  state: LifestyleState;
  affordableCost: number;
  affordabilityRatio: number;
}> {
  let remaining = currentBudget;
  const byId = new Map(BASE_LIFESTYLE_BUDGET.map((i) => [i.id, i]));

  return priorityOrder.map((id) => {
    const item = byId.get(id);
    if (!item) {
      return {
        id,
        label: String(id),
        cost: 0,
        state: 'gone' as const,
        affordableCost: 0,
        affordabilityRatio: 0,
      };
    }

    const currentCost = getInflatedItemCost(item.cost, item.category, year);

    if (remaining >= currentCost) {
      remaining -= currentCost;
      return {
        ...item,
        cost: currentCost,
        state: 'full' as const,
        affordableCost: currentCost,
        affordabilityRatio: 1,
      };
    }
    if (remaining > 0) {
      const affordableCost = remaining;
      const affordabilityRatio = Math.max(0, Math.min(1, affordableCost / currentCost));
      remaining = 0;
      return {
        ...item,
        cost: currentCost,
        state: 'partial' as const,
        affordableCost,
        affordabilityRatio,
      };
    }
    return {
      ...item,
      cost: currentCost,
      state: 'gone' as const,
      affordableCost: 0,
      affordabilityRatio: 0,
    };
  });
}

function formatCompactUsd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

/** Full-precision BTC amount from a fixed $100k conversion (up to 8 dp, trim trailing zeros). */
function formatBtcAmount(btc: number): string {
  if (!Number.isFinite(btc) || btc <= 0) return '0';
  const s = btc.toFixed(8);
  const trimmed = s.replace(/\.?0+$/, '');
  return trimmed;
}

/** Year-average BTC/USD for display (exact for the anchored table; interpolated years follow the curve). */
function formatBtcUsdPrice(usd: number): string {
  if (!Number.isFinite(usd) || usd <= 0) return '—';
  if (usd < 1) return `$${usd.toFixed(4)}`;
  return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function purchasingPowerOfMattressCash(year: number): number {
  const cpiStart = CPI_POINTS[BASE_YEAR];
  const cpiYear = interpolateByYear(CPI_POINTS, year);
  return BASE_AMOUNT * (cpiStart / cpiYear);
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
  const itemRowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [draggingItemId, setDraggingItemId] = useState<LifestyleItemId | null>(null);

  const lockDocumentScroll = () => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
  };

  const unlockDocumentScroll = () => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    document.documentElement.style.overflow = '';
    document.documentElement.style.overscrollBehavior = '';
  };

  const movePriorityByOffset = (id: LifestyleItemId, offset: number) => {
    setPriorityOrder((prev) => {
      const fromIndex = prev.indexOf(id);
      if (fromIndex < 0) return prev;
      const toIndex = Math.max(0, Math.min(prev.length - 1, fromIndex + offset));
      if (toIndex === fromIndex) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const reorderByDropIndex = (fromId: LifestyleItemId, targetDropIndex: number) => {
    setPriorityOrder((prev) => {
      const fromIndex = prev.indexOf(fromId);
      if (fromIndex < 0) return prev;
      const next = [...prev];
      next.splice(fromIndex, 1);
      const insertAt = targetDropIndex > fromIndex ? targetDropIndex - 1 : targetDropIndex;
      next.splice(Math.max(0, Math.min(insertAt, next.length)), 0, fromId);
      return next;
    });
  };

  const getTouchDropIndex = (clientY: number): number | null => {
    if (typeof document === 'undefined') return null;
    const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-inflation-row-index]'));
    if (rows.length === 0) return null;
    for (const row of rows) {
      const idxRaw = row.dataset.inflationRowIndex;
      if (idxRaw == null) continue;
      const idx = Number(idxRaw);
      if (Number.isNaN(idx)) continue;
      const rect = row.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      if (clientY < midpoint) return idx;
    }
    return rows.length;
  };

  const triggerLandingAnimation = (id: LifestyleItemId) => {
    const el = itemRowRefs.current[id];
    if (!el || typeof el.animate !== 'function') return;
    try {
      const rowElements = Object.values(itemRowRefs.current).filter(Boolean) as HTMLDivElement[];
      const landedIndex = rowElements.findIndex((node) => node === el);

      // Main dropped-row spring + glow sequence.
      el.animate(
        [
          { transform: 'translateY(-6px) scale(0.985)', boxShadow: '0 0 0 rgba(251,146,60,0)' },
          { transform: 'translateY(0px) scale(1.04)', boxShadow: '0 0 20px rgba(251,146,60,0.38)' },
          { transform: 'translateY(1px) scale(0.995)', boxShadow: '0 0 10px rgba(251,146,60,0.22)' },
          { transform: 'translateY(0px) scale(1.015)', boxShadow: '0 0 14px rgba(34,211,238,0.16)' },
          { transform: 'translateY(0px) scale(1)', boxShadow: '0 0 0 rgba(251,146,60,0)' },
        ],
        { duration: 520, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      );

      // Subtle settle for immediate neighbors for a cohesive feel.
      if (landedIndex >= 0) {
        const neighborIndices = [landedIndex - 1, landedIndex + 1].filter(
          (idx) => idx >= 0 && idx < rowElements.length
        );
        neighborIndices.forEach((idx, offset) => {
          const neighbor = rowElements[idx];
          neighbor.animate(
            [
              { transform: 'translateY(0px)', opacity: 0.94 },
              { transform: 'translateY(2px)', opacity: 1 },
              { transform: 'translateY(0px)', opacity: 1 },
            ],
            {
              duration: 320,
              delay: 35 + offset * 18,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }
          );
        });
      }
    } catch {
      // Ignore animation API issues silently.
    }
  };

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
  /** BTC you would receive converting the same unmoved $100k at this year's average BTC/USD. */
  const btcEquivalent = btcPrice ? BASE_AMOUNT / btcPrice : null;
  const btcTodayPrice = interpolateByYear(BTC_POINTS, MAX_YEAR);
  const btcValueAtTodayPrice = btcEquivalent ? btcEquivalent * btcTodayPrice : null;
  const mattressPurchasingPowerToday = useMemo(() => purchasingPowerOfMattressCash(MAX_YEAR), []);
  const btcVsCashMultiple =
    btcValueAtTodayPrice && mattressPurchasingPowerToday > 0
      ? btcValueAtTodayPrice / mattressPurchasingPowerToday
      : null;

  const terminalComparisonMax = useMemo(() => {
    const a = mattressPurchasingPowerToday;
    const b = btcValueAtTodayPrice ?? 0;
    return Math.max(a, b, 1);
  }, [mattressPurchasingPowerToday, btcValueAtTodayPrice]);

  const cashBarPct = (mattressPurchasingPowerToday / terminalComparisonMax) * 100;
  const btcBarPct =
    btcValueAtTodayPrice != null ? (btcValueAtTodayPrice / terminalComparisonMax) * 100 : 0;

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

  // Mobile focus mode: when open, lock background scroll.
  useEffect(() => {
    if (!open) return;
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 640) return;
    lockDocumentScroll();
    return () => {
      if (!isTouchDragging) {
        unlockDocumentScroll();
      }
    };
  }, [open, isTouchDragging]);

  if (authLoading || !isAuthenticated || !hydrated) return null;

  return (
    <div
      ref={trackerRef}
      className="fixed right-0 top-1/2 z-[120] -translate-y-1/2"
    >
      {open ? (
        <button
          type="button"
          aria-label="Close tracker backdrop"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[1px] sm:hidden"
        />
      ) : null}
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
          className={`z-40 border border-orange-400/30 bg-zinc-950/95 shadow-[0_0_30px_rgba(249,115,22,0.25)] transition-all duration-300 ${
            open
              ? 'w-[88vw] max-w-[360px] max-h-[min(85vh,calc(100dvh-1.5rem))] overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-l-xl p-4 sm:w-[320px] sm:rounded-none [scrollbar-gutter:stable]'
              : 'w-0 overflow-hidden p-0 border-l-0 border-r-0'
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
                  {trackingEnabled ? 'On' : 'Dashboard'}
                </span>
              </div>

              <p className="tabular-nums text-zinc-300">
                <span className="text-zinc-500">Year</span> <strong className="text-zinc-100">{year}</strong>
              </p>

              {!trackingEnabled ? (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-center text-sm text-zinc-400">
                  Start in Dashboard
                </div>
              ) : (
                <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-zinc-300">
                  <p className="text-center tabular-nums text-sm">
                    <span className="text-zinc-500">{BASE_YEAR}</span>{' '}
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
                                setTimeout(() => triggerLandingAnimation(fromId), 0);
                                return next;
                              });
                            }}
                          />
                          <div
                            ref={(el) => {
                              itemRowRefs.current[item.id] = el;
                            }}
                            data-inflation-row-index={idx}
                            className={`flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 ${
                              item.state === 'full'
                                ? 'border-green-500/30 bg-green-500/10 text-green-200'
                                : item.state === 'partial'
                                  ? 'border-amber-500/35 bg-amber-500/10 text-amber-200'
                                  : 'border-zinc-700 bg-zinc-900/70 text-zinc-500'
                            } ${
                              draggingItemId
                                ? draggingItemId === item.id
                                  ? 'ring-2 ring-orange-400/70 shadow-[0_0_18px_rgba(249,115,22,0.35)] scale-[1.01] opacity-100'
                                  : 'opacity-35 saturate-50'
                                : ''
                            } ${isTouchDragging ? 'cursor-grabbing' : 'cursor-grab'} transition-all duration-150`}
                            draggable
                            style={{ touchAction: isTouchDragging ? 'none' : 'manipulation' }}
                            onDragStart={(e) => {
                              dragIdRef.current = item.id;
                              setDraggingItemId(item.id);
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
                              setDraggingItemId(null);
                              setDropIndex(null);
                            }}
                            onTouchStart={() => {
                              dragIdRef.current = item.id;
                              setDraggingItemId(item.id);
                              setIsTouchDragging(true);
                              setDropIndex(idx);
                              lockDocumentScroll();
                            }}
                            onTouchMove={(e) => {
                              if (!dragIdRef.current) return;
                              const touch = e.touches[0];
                              if (!touch) return;
                              const target = getTouchDropIndex(touch.clientY);
                              if (target != null) {
                                setDropIndex(target);
                              }
                              e.preventDefault();
                            }}
                            onTouchEnd={() => {
                              const fromId = dragIdRef.current;
                              const target = dropIndex;
                              dragIdRef.current = null;
                              setDraggingItemId(null);
                              setIsTouchDragging(false);
                              setDropIndex(null);
                              if (!open) {
                                unlockDocumentScroll();
                              }
                              if (!fromId || target == null) return;
                              reorderByDropIndex(fromId, target);
                              setTimeout(() => triggerLandingAnimation(fromId), 0);
                            }}
                            onTouchCancel={() => {
                              dragIdRef.current = null;
                              setDraggingItemId(null);
                              setIsTouchDragging(false);
                              setDropIndex(null);
                              if (!open) {
                                unlockDocumentScroll();
                              }
                            }}
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="text-[10px] text-zinc-400 select-none">↕</span>
                              <span className="text-xs font-medium truncate">{item.label}</span>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="text-[10px] tabular-nums text-zinc-400">
                                {formatCompactUsd(item.cost)}
                              </span>
                              <span className="w-9 text-right text-[10px] font-semibold tabular-nums">
                                {(item.affordabilityRatio * 100).toFixed(0)}%
                              </span>
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
                          setTimeout(() => triggerLandingAnimation(fromId), 0);
                          return next;
                        });
                      }}
                    />
                  </div>
                  {btcPrice ? (
                    <div className="rounded-md border border-zinc-700 bg-zinc-900/60 p-2.5 text-zinc-300">
                      <p className="mb-2 text-center text-[11px] font-medium text-zinc-200">
                        By {MAX_YEAR}: same ${BASE_AMOUNT.toLocaleString()}
                      </p>
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-2.5 py-2 text-[10px] leading-snug text-zinc-500">
                        <p>
                          <span className="font-medium text-zinc-400">Cash</span> — keep the{' '}
                          <span className="tabular-nums text-zinc-300">${BASE_AMOUNT.toLocaleString()}</span>.{' '}
                          <span className="font-medium text-orange-300/80">BTC</span> — all-in in{' '}
                          <span className="text-zinc-300">{year}</span>:{' '}
                          <span className="select-all font-medium text-orange-200">
                            {btcEquivalent != null ? formatBtcAmount(btcEquivalent) : '—'} BTC
                          </span>{' '}
                          @ <span className="tabular-nums text-zinc-300">{formatBtcUsdPrice(btcPrice)}</span>.
                        </p>
                        <p className="mt-1.5 border-t border-zinc-800/80 pt-1.5 text-zinc-600">
                          In {year}, that cash still bought{' '}
                          <span className="font-medium tabular-nums text-zinc-400">
                            ${displayLifestyleBudget.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </span>{' '}
                          of the 1971 basket (same year as the widget).
                        </p>
                      </div>

                      <p className="mt-3 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                        Both measured in {MAX_YEAR} (1971 basket · USD)
                      </p>
                      <div className="mt-2 space-y-3">
                        <div>
                          <div className="mb-1 flex items-baseline justify-between gap-2">
                            <span className="text-[11px] text-zinc-400">Cash</span>
                            <span className="text-sm font-semibold tabular-nums text-zinc-100">
                              $
                              {mattressPurchasingPowerToday.toLocaleString('en-US', {
                                maximumFractionDigits: 0,
                              })}
                            </span>
                          </div>
                          <div
                            className="h-2.5 overflow-hidden rounded-full bg-zinc-800"
                            role="presentation"
                          >
                            <div
                              className="h-full min-w-[2px] rounded-full bg-zinc-500 transition-[width] duration-500"
                              style={{ width: `${cashBarPct}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 flex items-baseline justify-between gap-2">
                            <span className="text-[11px] text-orange-300/90">BTC → USD</span>
                            <span className="text-sm font-semibold tabular-nums text-cyan-300">
                              $
                              {btcValueAtTodayPrice != null
                                ? btcValueAtTodayPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })
                                : '—'}
                            </span>
                          </div>
                          <div
                            className="h-2.5 overflow-hidden rounded-full bg-zinc-800"
                            role="presentation"
                          >
                            <div
                              className="h-full min-w-[2px] rounded-full bg-gradient-to-r from-orange-500 to-cyan-400 transition-[width] duration-500"
                              style={{ width: `${btcBarPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 rounded-lg border border-orange-400/25 bg-orange-500/10 py-2 text-center">
                        <div className="text-[10px] font-medium uppercase tracking-wide text-orange-200/80">
                          BTC side is larger by
                        </div>
                        <div className="mt-0.5 text-xl font-bold tabular-nums text-orange-200">
                          {btcVsCashMultiple != null ? `${btcVsCashMultiple.toFixed(1)}×` : '—'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded border border-zinc-700 bg-zinc-950/70 p-2 text-center text-zinc-500 text-xs tabular-nums">
                      BTC ≥ {Math.min(...Object.keys(BTC_POINTS).map(Number))}
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

