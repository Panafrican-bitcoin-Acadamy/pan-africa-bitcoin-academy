'use client';

import { useMemo, type ReactNode } from 'react';
import type { GlossaryEntry, ReadingMode } from '@/content/bitcoin-whitepaper/types';

type Props = {
  text: string;
  glossary: GlossaryEntry[];
  readingMode: ReadingMode;
  highlightPhrase?: string;
  onTermClick: (def: string) => void;
};

function sortedTerms(glossary: GlossaryEntry[]) {
  return [...glossary].sort((a, b) => b.term.length - a.term.length);
}

function wrapSegment(
  segment: string,
  terms: GlossaryEntry[],
  onTermClick: (def: string) => void
): ReactNode[] {
  if (!segment) return [];
  const lower = segment.toLowerCase();
  const out: ReactNode[] = [];
  let pos = 0;
  let key = 0;

  while (pos < segment.length) {
    let best: { start: number; term: string; def: string; len: number } | null = null;
    for (const { term, definition } of terms) {
      const tl = term.toLowerCase();
      const idx = lower.indexOf(tl, pos);
      if (idx < 0) continue;
      if (!best || idx < best.start || (idx === best.start && tl.length > best.len)) {
        best = { start: idx, term, def: definition, len: tl.length };
      }
    }
    if (!best) {
      out.push(segment.slice(pos));
      break;
    }
    if (best.start > pos) {
      out.push(segment.slice(pos, best.start));
    }
    const matched = segment.slice(best.start, best.start + best.len);
    out.push(
      <button
        key={`g-${key++}`}
        type="button"
        onClick={() => onTermClick(`${best!.term}: ${best!.def}`)}
        className="border-b border-dotted border-cyan-300/60 text-cyan-50 underline-offset-2 transition hover:border-cyan-200 hover:text-white"
        title={best.def}
      >
        {matched}
      </button>
    );
    pos = best.start + best.len;
  }
  return out;
}

export function GlossaryText({ text, glossary, readingMode, highlightPhrase, onTermClick }: Props) {
  const terms = useMemo(() => sortedTerms(glossary), [glossary]);

  return useMemo(() => {
    const render = (t: string) => {
      const parts = wrapSegment(t, terms, onTermClick);
      return parts.length === 1 ? parts[0] : <>{parts}</>;
    };

    if (readingMode === 'highlight' && highlightPhrase) {
      const idx = text.indexOf(highlightPhrase);
      if (idx >= 0) {
        return (
          <span className="leading-[inherit]">
            {render(text.slice(0, idx))}
            <mark className="rounded-sm bg-amber-500/25 px-0.5 text-amber-50 ring-1 ring-amber-400/30">
              {render(text.slice(idx, idx + highlightPhrase.length))}
            </mark>
            {render(text.slice(idx + highlightPhrase.length))}
          </span>
        );
      }
    }

    return <span className="leading-[inherit]">{render(text)}</span>;
  }, [text, terms, readingMode, highlightPhrase, onTermClick]);
}
