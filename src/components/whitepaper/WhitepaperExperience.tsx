'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  Download,
  Highlighter,
  Layers,
  Menu,
  Printer,
  Sparkles,
  X,
} from 'lucide-react';
import { WhitepaperDiagram } from '@/components/whitepaper/Diagrams';
import { SectionShareMenu } from '@/components/whitepaper/SectionShareMenu';
import { WhitepaperParagraphBlock } from '@/components/whitepaper/WhitepaperParagraphBlock';
import { WHITEPAPER_GLOSSARY } from '@/content/bitcoin-whitepaper/glossary';
import { cn } from '@/lib/styles';
import {
  WHITEPAPER_SECTIONS,
  WHITEPAPER_TIMELINE,
  countWords,
} from '@/content/bitcoin-whitepaper/sections';
import type { AnnotationLayer, ReadingMode } from '@/content/bitcoin-whitepaper/types';

const PDF_URL = 'https://bitcoin.org/bitcoin.pdf';
const WORDS = countWords(WHITEPAPER_SECTIONS);
const READ_MINUTES = Math.max(12, Math.round(WORDS / 200));

/**
 * Satoshi’s bibliography [1]–[8] (full citations) + canonical PDF.
 * `href` omitted when no stable public URL; optional links point to common mirrors/DOIs.
 */
const REFERENCES: { label: string; href?: string }[] = [
  {
    label:
      '[1] W. Dai, "b-money," http://www.weidai.com/bmoney.txt, 1998.',
    href: 'https://www.weidai.com/bmoney.txt',
  },
  {
    label:
      '[2] H. Massias, X.S. Avila, and J.-J. Quisquater, "Design of a secure timestamping service with minimal trust requirements," In 20th Symposium on Information Theory in the Benelux, May 1999.',
  },
  {
    label:
      '[3] S. Haber, W.S. Stornetta, "How to time-stamp a digital document," In Journal of Cryptology, vol 3, no 2, pages 99-111, 1991.',
    href: 'https://doi.org/10.1007/BF00196791',
  },
  {
    label:
      '[4] D. Bayer, S. Haber, W.S. Stornetta, "Improving the efficiency and reliability of digital time-stamping," In Sequences II: Methods in Communication, Security and Computer Science, pages 329-334, 1993.',
    href: 'https://doi.org/10.1007/978-1-4613-9323-8_24',
  },
  {
    label:
      '[5] S. Haber, W.S. Stornetta, "Secure names for bit-strings," In Proceedings of the 4th ACM Conference on Computer and Communications Security, pages 28-35, April 1997.',
    href: 'https://dl.acm.org/doi/10.1145/266420.266430',
  },
  {
    label:
      '[6] A. Back, "Hashcash - a denial of service counter-measure," http://www.hashcash.org/papers/hashcash.pdf, 2002.',
    href: 'https://www.hashcash.org/papers/hashcash.pdf',
  },
  {
    label:
      '[7] R.C. Merkle, "Protocols for public key cryptosystems," In Proc. 1980 Symposium on Security and Privacy, IEEE Computer Society, pages 122-133, April 1980.',
    href: 'https://nakamotoinstitute.org/library/public-key-cryptosystems/',
  },
  {
    label: '[8] W. Feller, "An introduction to probability theory and its applications," 1957.',
  },
  { label: 'Full paper PDF — bitcoin.org/bitcoin.pdf', href: PDF_URL },
];

/**
 * Scroll depth through the main reading column only (0–100), so the bar matches
 * article progress rather than footer/chrome below the paper.
 */
function getReadingProgressForMain(mainEl: HTMLElement | null): number {
  if (typeof window === 'undefined' || !mainEl) return 0;
  const scrollY = window.scrollY;
  const winH = window.innerHeight;
  const rect = mainEl.getBoundingClientRect();
  const mainTop = rect.top + scrollY;
  const mainH = mainEl.scrollHeight;
  const start = mainTop;
  const end = mainTop + mainH - winH;
  const range = end - start;
  if (range <= 0) return scrollY >= start ? 100 : 0;
  const pct = ((scrollY - start) / range) * 100;
  return Math.min(100, Math.max(0, pct));
}

type SectionOutlineVariant = 'sidebar' | 'sheet';

function SectionOutline({
  activeId,
  onSelect,
  variant,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  variant: SectionOutlineVariant;
}) {
  return (
    <nav className={cn('flex flex-col', variant === 'sidebar' ? 'gap-1.5' : 'gap-2')} aria-label="Whitepaper sections">
      {WHITEPAPER_SECTIONS.map((s, si) => {
        const active = activeId === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={cn(
              'group flex w-full min-w-0 items-center gap-3 rounded-xl border text-left transition',
              variant === 'sheet' && 'min-h-[48px] touch-manipulation',
              variant === 'sidebar' && 'px-2.5 py-2',
              variant === 'sheet' && 'px-3 py-2.5',
              active
                ? 'border-cyan-500/35 bg-gradient-to-r from-cyan-500/15 to-transparent shadow-[inset_0_0_0_1px_rgba(34,211,238,0.12)]'
                : 'border-zinc-700/50 bg-zinc-900/25 hover:border-zinc-500/60 hover:bg-zinc-900/55',
            )}
          >
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tabular-nums',
                active
                  ? 'bg-cyan-500/25 text-cyan-100 ring-1 ring-cyan-400/30'
                  : 'bg-zinc-800/90 text-zinc-500 group-hover:text-zinc-300',
              )}
              aria-hidden
            >
              {si + 1}
            </span>
            <span
              className={cn(
                'min-w-0 flex-1 hyphens-none break-words leading-snug',
                variant === 'sidebar' && 'text-[12px]',
                variant === 'sheet' && 'text-sm',
                active ? 'font-semibold text-cyan-50' : 'font-medium text-zinc-400 group-hover:text-zinc-100',
              )}
            >
              {s.navLabel}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function WhitepaperExperience() {
  const [readingMode, setReadingMode] = useState<ReadingMode>('original');
  const [annotationLayer, setAnnotationLayer] = useState<AnnotationLayer>('annotated');
  const [activeId, setActiveId] = useState(WHITEPAPER_SECTIONS[0].id);
  const [progress, setProgress] = useState(0);
  const [termToast, setTermToast] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [progressBarHeight, setProgressBarHeight] = useState(48);
  /** When true, reading bar is fixed under the site header (scroll past top of page). */
  const [progressPinned, setProgressPinned] = useState(false);
  /** Measured height of #site-header — fixed progress uses this as `top` so there is no gap under the navbar. */
  const [navBottomPx, setNavBottomPx] = useState(56);
  const [scrollY, setScrollY] = useState(0);
  const mainRef = useRef<HTMLElement>(null);
  const progressSentinelRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const reducedMotion = useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      mq.addEventListener('change', onStoreChange);
      return () => mq.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  );

  const updateProgress = useCallback(() => {
    setProgress(getReadingProgressForMain(mainRef.current));
  }, []);

  const updateProgressPinned = useCallback(() => {
    const s = progressSentinelRef.current;
    if (!s) return;
    setProgressPinned(s.getBoundingClientRect().top < 0);
  }, []);

  useLayoutEffect(() => {
    const el = progressBarRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setProgressBarHeight(el.getBoundingClientRect().height);
    });
    ro.observe(el);
    setProgressBarHeight(el.getBoundingClientRect().height);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const ro = new ResizeObserver(() => updateProgress());
    ro.observe(main);
    return () => ro.disconnect();
  }, [updateProgress]);

  useEffect(() => {
    const onScrollOrResize = () => {
      setScrollY(window.scrollY);
      updateProgress();
      updateProgressPinned();
    };
    onScrollOrResize();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [updateProgress, updateProgressPinned]);

  useLayoutEffect(() => {
    updateProgressPinned();
  }, [updateProgressPinned]);

  useLayoutEffect(() => {
    const header = document.getElementById('site-header');
    if (!header) return;
    const sync = () => setNavBottomPx(Math.round(header.getBoundingClientRect().height));
    const ro = new ResizeObserver(sync);
    ro.observe(header);
    sync();
    window.addEventListener('resize', sync, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (visible?.target?.id) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: '-42% 0px -42% 0px', threshold: [0, 0.05, 0.25, 0.5, 0.75, 1] }
    );
    WHITEPAPER_SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!termToast) return;
    const ms = termToast.includes('clipboard') || termToast.includes('Link') ? 2400 : 5200;
    const t = window.setTimeout(() => setTermToast(null), ms);
    return () => clearTimeout(t);
  }, [termToast]);

  const onTermClick = useCallback((def: string) => {
    setTermToast(def);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
    setMobileNav(false);
  };

  const copySection = async (id: string) => {
    const sec = WHITEPAPER_SECTIONS.find((s) => s.id === id);
    if (!sec) return;
    const text = [sec.title, '', ...sec.paragraphs].join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setTermToast('Section copied to clipboard.');
    } catch {
      setTermToast('Copy failed — try manually.');
    }
  };

  const printPage = () => window.print();

  const modeHelp = useMemo(
    () =>
      ({
        original: 'Satoshi’s text only (plus your glossary taps).',
        simplified: 'Adds plain-language notes under each section.',
        highlight: 'Emphasizes key phrases in amber.',
      }) as const,
    []
  );

  const activeNavLabel = useMemo(
    () => WHITEPAPER_SECTIONS.find((s) => s.id === activeId)?.navLabel ?? '',
    [activeId]
  );

  /** Pinned bar moves to viewport top (above sticky nav) once the header has left or user has scrolled past the nav stack. */
  const progressTakeover = useMemo(() => {
    if (!progressPinned) return false;
    if (typeof document === 'undefined') return false;
    const header = document.getElementById('site-header');
    if (header) {
      const r = header.getBoundingClientRect();
      if (r.bottom <= 0) return true;
    }
    return scrollY > navBottomPx + 24;
  }, [progressPinned, scrollY, navBottomPx]);

  const { stickyStackPx, sectionScrollMtPx } = useMemo(() => {
    const pad = 8;
    const scrollMtExtra = 12;
    if (progressTakeover) {
      const top = progressBarHeight + pad;
      return {
        stickyStackPx: top,
        sectionScrollMtPx: progressBarHeight + scrollMtExtra,
      };
    }
    const top = navBottomPx + progressBarHeight + pad;
    return {
      stickyStackPx: top,
      sectionScrollMtPx: navBottomPx + progressBarHeight + scrollMtExtra,
    };
  }, [progressTakeover, navBottomPx, progressBarHeight]);

  return (
    <div
      className="whitepaper-root relative min-h-screen w-full min-w-0 print:bg-white print:text-black"
      style={
        {
          ['--wp-progress-h' as string]: `${progressBarHeight}px`,
          ['--wp-nav-offset' as string]: `${navBottomPx}px`,
          ['--wp-sticky-stack' as string]: `${stickyStackPx}px`,
          ['--wp-section-scroll-mt' as string]: `${sectionScrollMtPx}px`,
        } as CSSProperties
      }
    >
      {/* Sentinel: when it scrolls above the viewport, pin the bar fixed with top = measured #site-header height (no gap). */}
      <div
        ref={progressSentinelRef}
        className="pointer-events-none h-px min-h-px w-full shrink-0 print:hidden"
        aria-hidden
      />
      <div
        ref={progressBarRef}
        className={[
          'w-full border-b border-zinc-700/90 bg-[#050810]/95 backdrop-blur-md print:hidden',
          progressPinned
            ? `fixed right-0 left-0 m-0 shadow-[0_4px_16px_rgba(0,0,0,0.28)] ${progressTakeover ? 'z-[55] pt-[env(safe-area-inset-top,0px)]' : 'z-40'}`
            : 'relative z-30 m-0 shadow-none',
        ].join(' ')}
        style={
          progressPinned
            ? { top: progressTakeover ? 0 : navBottomPx }
            : undefined
        }
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-0 py-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] sm:pl-4 sm:pr-4">
          <div className="flex w-full flex-col gap-0 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
            <div
              className="flex w-full min-w-0 flex-col gap-0 sm:flex-1 sm:flex-row sm:items-center sm:gap-2"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              aria-valuetext={`${Math.round(progress)}% — ${activeNavLabel}`}
              aria-label={`Reading progress ${Math.round(progress)} percent. Current section: ${activeNavLabel}`}
            >
              <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-cyan-300">
                Reading progress
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div
                  className="h-2 min-h-[8px] min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-800 sm:h-1.5 sm:max-w-xs"
                  aria-hidden
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-cyan-400 transition-[width] duration-150 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="shrink-0 tabular-nums text-xs text-zinc-300">{Math.round(progress)}%</span>
              </div>
            </div>
            <p className="shrink-0 text-center text-[11px] leading-snug whitespace-nowrap text-zinc-400 sm:text-left">
              ~{READ_MINUTES} min · {WORDS.toLocaleString()} words
            </p>
          </div>
          {activeNavLabel ? (
            <p
              className="w-full truncate border-t border-zinc-700/60 pt-2 text-center text-[10px] leading-snug text-zinc-500 sm:text-left"
              title={activeNavLabel}
            >
              <span className="text-zinc-500">Now reading: </span>
              <span className="font-medium text-zinc-300">{activeNavLabel}</span>
            </p>
          ) : null}
        </div>
      </div>
      {progressPinned ? (
        <div className="print:hidden" style={{ height: progressBarHeight }} aria-hidden />
      ) : null}

      {termToast && (
        <div
          role="status"
          className="fixed left-1/2 z-[60] max-w-[min(100%-1.5rem,28rem)] -translate-x-1/2 rounded-lg border border-zinc-600 bg-[#0c1220] px-4 py-2 text-sm text-zinc-100 shadow-xl print:hidden bottom-[max(6rem,env(safe-area-inset-bottom,0px))]"
        >
          {termToast}
        </div>
      )}

      <div className="mx-auto flex w-full min-w-0 max-w-[1600px] gap-0 overflow-x-clip px-0 print:max-w-none lg:gap-8 lg:px-6">
        <aside className="no-print hidden w-[17rem] shrink-0 lg:block xl:w-[17.5rem]">
          <div
            className="sticky top-[var(--wp-sticky-stack,72px)] max-h-[calc(100dvh-var(--wp-sticky-stack,72px)-1.5rem)] overflow-y-auto overflow-x-hidden py-6 pr-2"
          >
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-zinc-700/60 bg-zinc-900/30 px-3 py-2.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/20">
                <BookOpen className="h-4 w-4 text-cyan-300/90" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-300">Paper outline</p>
                <p lang="ti" className="mt-0.5 text-[11px] leading-snug text-zinc-500">
                  ኣርእስትታት
                </p>
              </div>
            </div>
            <SectionOutline activeId={activeId} onSelect={scrollToSection} variant="sidebar" />
            <Link
              href="/chapters"
              className="mt-6 inline-flex items-center gap-1 text-[11px] text-orange-300/90 hover:text-orange-200"
            >
              Back to chapters <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </aside>

        <main
          ref={mainRef}
          id="whitepaper-main"
          className="min-w-0 flex-1 pt-3 pb-8 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-6 sm:pt-4 lg:pb-10 lg:pt-5"
        >
          <header className="mx-auto mb-8 w-full max-w-[min(100%,52rem)] border-b border-zinc-700 px-0 pb-6 text-center print:max-w-none sm:mb-10 sm:pb-8">
            <h1
              lang="ti"
              className="hyphens-manual whitespace-normal break-words px-0.5 text-xl font-bold leading-[1.65] tracking-normal text-white sm:text-2xl sm:leading-[1.6] md:text-3xl md:leading-[1.55] lg:text-[2rem] lg:leading-[1.5]"
            >
              ቢትኮይን፡ ስርዓት ናይ መዘና-ናብ-መዘና ኤሌክትሮኒካዊ ገንዘብ
            </h1>
            <p className="mt-8 text-base font-medium text-zinc-200 sm:text-lg">ሳቶሺ ናካሞቶ</p>
            <p className="mt-2">
              <a
                href="mailto:satoshin@gmx.com"
                className="text-sm text-cyan-300 underline decoration-cyan-500/50 underline-offset-2 hover:text-cyan-200 print:text-zinc-800"
              >
                satoshin@gmx.com
              </a>
            </p>
            <p className="mt-1">
              <a
                href="https://www.bitcoin.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-cyan-300 underline decoration-cyan-500/50 underline-offset-2 hover:text-cyan-200 print:text-zinc-800"
              >
                www.bitcoin.org
              </a>
            </p>
            <div className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-3 print:hidden">
              {WHITEPAPER_TIMELINE.map((t) => (
                <div
                  key={t.year}
                  className="rounded-lg border border-zinc-600 bg-[#0c1220] px-3 py-2 text-left"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">{t.year}</p>
                  <p className="text-xs font-medium text-zinc-100">{t.label}</p>
                  <p className="text-[11px] text-zinc-400">{t.detail}</p>
                </div>
              ))}
            </div>
          </header>

          <div className="no-print mx-auto mb-10 max-w-[min(100%,48rem)] space-y-4 rounded-xl border border-zinc-600 bg-[#0c1220] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Reading mode</span>
              {(
                [
                  ['original', 'ኦርጅናል ኣጸሓሕፋ', BookOpen],
                  ['simplified', 'ብዝቀለለ', Sparkles],
                  ['highlight', 'Highlights', Highlighter],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setReadingMode(id)}
                  title={modeHelp[id]}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    readingMode === id
                      ? 'bg-cyan-500/25 text-cyan-50 ring-1 ring-cyan-400/50'
                      : 'bg-[#070b12] text-zinc-300 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 opacity-80" />
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-zinc-700 pt-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Layer</span>
              <button
                type="button"
                onClick={() => setAnnotationLayer('raw')}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  annotationLayer === 'raw'
                    ? 'bg-orange-500/20 text-orange-200 ring-1 ring-orange-400/30'
                    : 'bg-[#070b12] text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                Raw Satoshi
              </button>
              <button
                type="button"
                onClick={() => setAnnotationLayer('annotated')}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${
                  annotationLayer === 'annotated'
                    ? 'bg-orange-500/20 text-orange-200 ring-1 ring-orange-400/30'
                    : 'bg-[#070b12] text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Annotated
              </button>
              {annotationLayer === 'annotated' ? (
                <span className="text-[11px] text-zinc-400">Shows short notes alongside the paper.</span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-zinc-700 pt-3">
              <a
                href={PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-600 bg-[#070b12] px-3 py-2 text-xs font-medium text-zinc-100 hover:border-cyan-500/50"
              >
                <Download className="h-3.5 w-3.5" /> PDF (bitcoin.org)
              </a>
              <a
                href="/doc_files/Bitcoin%20white%20paper%20Tigrigna.pdf"
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-600 bg-[#070b12] px-3 py-2 text-xs font-medium text-zinc-100 hover:border-cyan-500/50"
              >
                <Download className="h-3.5 w-3.5" /> PDF (ትግርኛ)
              </a>
              <button
                type="button"
                onClick={printPage}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-600 bg-[#070b12] px-3 py-2 text-xs font-medium text-zinc-100 hover:border-cyan-500/50"
              >
                <Printer className="h-3.5 w-3.5" /> Print
              </button>
            </div>
          </div>

          <div className="no-print mb-6 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3 lg:hidden">
            <Link
              href="/chapters"
              className="inline-flex min-h-[44px] shrink-0 touch-manipulation items-center justify-center gap-1.5 rounded-lg border border-zinc-600/80 bg-transparent px-4 py-3 text-sm font-medium text-orange-300/90 transition hover:border-orange-400/50 hover:bg-[#0c1220] hover:text-orange-200 active:bg-[#0c1220]"
            >
              Back to chapters <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
            <button
              type="button"
              onClick={() => setMobileNav(true)}
              className="inline-flex min-h-[44px] min-w-0 flex-1 touch-manipulation items-center justify-center gap-2 rounded-lg border border-zinc-600 bg-[#0c1220] px-4 py-3 text-sm font-medium text-zinc-100 active:bg-zinc-800"
            >
              <Menu className="h-4 w-4 shrink-0" aria-hidden />
              Open outline
            </button>
          </div>
          {mobileNav && (
            <div
              className="no-print fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileNav(false)}
              onKeyDown={(e) => e.key === 'Escape' && setMobileNav(false)}
              role="presentation"
            >
              <div
                className="max-h-[min(70vh,100dvh-5rem)] w-full touch-manipulation overflow-y-auto rounded-t-2xl border border-zinc-600 bg-[#070b12] p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-label="Paper outline"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/20">
                      <BookOpen className="h-4 w-4 text-cyan-300/90" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-white">Paper outline</span>
                      <span lang="ti" className="block text-[11px] leading-snug text-zinc-500">
                        ኣርእስትታት
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileNav(false)}
                    className="shrink-0 rounded-full p-2 text-zinc-400 hover:bg-zinc-800"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <SectionOutline activeId={activeId} onSelect={scrollToSection} variant="sheet" />
                <Link
                  href="/chapters"
                  className="mt-5 inline-flex items-center gap-1 border-t border-zinc-700 pt-4 text-[13px] font-medium text-orange-300/90 hover:text-orange-200"
                  onClick={() => setMobileNav(false)}
                >
                  Back to chapters <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                </Link>
              </div>
            </div>
          )}

          <div className="mx-auto max-w-[min(100%,42rem)] print:max-w-none">
            {WHITEPAPER_SECTIONS.map((section, si) => {
              const phrasesForParagraph = (pi: number) =>
                section.highlights.filter((h) => h.paragraphIndex === pi).map((h) => h.phrase);

              return (
                <section
                  key={section.id}
                  id={section.id}
                  className={`wp-section mb-16 scroll-mt-[var(--wp-section-scroll-mt,80px)] opacity-100 transition-all duration-500 print:mb-10 print:opacity-100 ${
                    reducedMotion ? '' : 'motion-safe:translate-y-0 motion-safe:opacity-100'
                  }`}
                  style={
                    reducedMotion
                      ? undefined
                      : {
                          transitionDelay: `${Math.min(si * 40, 400)}ms`,
                        }
                  }
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-2 border-b border-zinc-700 pb-3">
                    <h2 className="text-xl font-semibold text-cyan-50 sm:text-2xl">{section.title}</h2>
                    <div className="flex flex-wrap gap-1 print:hidden">
                      <button
                        type="button"
                        onClick={() => copySection(section.id)}
                        className="rounded-md border border-zinc-600 p-1.5 text-zinc-300 hover:text-cyan-200"
                        title="Copy section"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <SectionShareMenu
                        sectionId={section.id}
                        sectionTitle={section.title}
                        sectionPlainText={section.paragraphs.join('\n\n')}
                        onNotify={setTermToast}
                      />
                    </div>
                  </div>

                  {readingMode === 'simplified' && (
                    <div className="mb-6 space-y-2 rounded-lg border border-cyan-500/35 bg-[#0a1522] p-4 text-sm leading-relaxed print:border-zinc-300 print:bg-zinc-100">
                      <p>
                        <span className="font-semibold text-cyan-200">እዚ ክፍሊ’ዚ እንታይ ማለት እዩ፡ </span>
                        <span className="text-zinc-100 print:text-zinc-800">{section.insights.whatItMeans}</span>
                      </p>
                      <p>
                        <span className="font-semibold text-orange-200">ሎሚ ስለምንታይ ኣገዳሲ ኮይኑ: </span>
                        <span className="text-zinc-100 print:text-zinc-800">{section.insights.whyItMatters}</span>
                      </p>
                    </div>
                  )}

                  {readingMode === 'simplified' && section.simplifiedNotes.length > 0 && (
                    <div className="mb-6 rounded-lg border border-purple-500/40 bg-[#140a18] p-4 text-sm leading-relaxed text-purple-50 print:hidden">
                      <p className="mb-1 text-[11px] font-semibold tracking-wide text-purple-200">
                        ብዝቀለለ
                      </p>
                      {section.simplifiedNotes.map((note, i) => (
                        <p key={i} className="mb-2 last:mb-0">
                          {note}
                        </p>
                      ))}
                    </div>
                  )}

                  {annotationLayer === 'annotated' &&
                    section.commentary.map((c, i) => (
                      <p
                        key={i}
                        className="mb-4 border-l-2 border-orange-400/60 pl-3 text-sm italic leading-relaxed text-orange-50 print:border-zinc-400 print:text-zinc-700"
                      >
                        <span className="font-sans not-italic text-[10px] font-bold uppercase tracking-wider text-orange-300">
                          Note —{' '}
                        </span>
                        {c}
                      </p>
                    ))}

                  {!['s-2', 's-3', 's-4', 's-7', 's-8', 's-9', 's-10'].includes(section.id) && <WhitepaperDiagram sectionId={section.id} />}

                  {section.paragraphs.map((para, pi) => (
                    <div key={pi}>
                      <div
                        className={`wp-para ${reducedMotion ? '' : 'motion-safe:animate-in fade-in slide-in-from-bottom-2'}`}
                        style={reducedMotion ? undefined : { animationDelay: `${pi * 35}ms` }}
                      >
                        <WhitepaperParagraphBlock
                          body={para}
                          glossary={WHITEPAPER_GLOSSARY}
                          readingMode={readingMode}
                          highlightPhrases={phrasesForParagraph(pi)}
                          onTermClick={onTermClick}
                        />
                      </div>
                      {['s-2', 's-3', 's-4', 's-7', 's-8', 's-9', 's-10'].includes(section.id) && pi === 0 && <WhitepaperDiagram sectionId={section.id} />}
                    </div>
                  ))}

                  {annotationLayer === 'annotated' && section.checkpoint && <Checkpoint quiz={section.checkpoint} />}
                </section>
              );
            })}

            <footer className="mt-16 border-t border-zinc-700 pt-8 text-sm text-zinc-300">
              <h3 className="mb-3 text-base font-semibold text-zinc-100">References</h3>
              <ul className="list-outside space-y-3 pl-5 text-zinc-300 marker:text-zinc-500">
                {REFERENCES.map((r, i) => (
                  <li key={i} className="break-words pl-1">
                    {r.href ? (
                      <a
                        href={r.href}
                        className="text-cyan-400/90 underline-offset-2 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {r.label}
                      </a>
                    ) : (
                      <span>{r.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

function Checkpoint({ quiz }: { quiz: NonNullable<(typeof WHITEPAPER_SECTIONS)[0]['checkpoint']> }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="mt-8 rounded-xl border border-zinc-600 bg-[#0c1220] p-4 print:hidden">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Checkpoint</p>
      <p className="mb-3 text-sm font-medium text-zinc-50">{quiz.question}</p>
      <ul className="space-y-2">
        {quiz.options.map((opt, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => setPicked(i)}
              className={`flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                picked === i
                  ? i === quiz.correctIndex
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-100'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-100'
                  : 'border-zinc-600 bg-[#070b12] text-zinc-200 hover:border-zinc-500'
              }`}
            >
              {picked === i && i === quiz.correctIndex && <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />}
              {opt}
            </button>
          </li>
        ))}
      </ul>
      {picked !== null && (
        <p className="mt-3 text-xs leading-relaxed text-zinc-400">
          <span className="font-medium text-zinc-300">Takeaway: </span>
          {quiz.explanation}
        </p>
      )}
    </div>
  );
}
