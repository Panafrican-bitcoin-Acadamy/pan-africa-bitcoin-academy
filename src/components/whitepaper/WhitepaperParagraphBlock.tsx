'use client';

import { GlossaryText } from '@/components/whitepaper/GlossaryText';
import type { GlossaryEntry, ReadingMode } from '@/content/bitcoin-whitepaper/types';
import type { ReactNode } from 'react';

export type ParsedBlock =
  | { kind: 'text'; body: string }
  | { kind: 'code'; body: string }
  | { kind: 'table'; body: string }
  | { kind: 'deflist'; body: string }
  | { kind: 'eq'; body: string }
  | { kind: 'ol'; body: string };

function stripMarkers(open: string, close: string, t: string): string {
  return t.replace(new RegExp(`^${open}\\s*`, 'u'), '').replace(new RegExp(`\\s*${close}\\s*$`, 'u'), '');
}

export function parseParagraphBody(p: string): ParsedBlock {
  const t = p.trim();
  if (t.startsWith('<<<CODE>>>')) {
    const body = stripMarkers('<<<CODE>>>', '<<<CODE>>>', t);
    return { kind: 'code', body };
  }
  if (t.startsWith('<<<TABLE>>>')) {
    const body = stripMarkers('<<<TABLE>>>', '<<<TABLE>>>', t);
    return { kind: 'table', body };
  }
  if (t.startsWith('<<<DEFLIST>>>')) {
    const body = stripMarkers('<<<DEFLIST>>>', '<<<DEFLIST>>>', t);
    return { kind: 'deflist', body };
  }
  if (t.startsWith('<<<EQ>>>')) {
    const body = stripMarkers('<<<EQ>>>', '<<<EQ>>>', t);
    return { kind: 'eq', body };
  }
  if (t.startsWith('<<<OL>>>')) {
    const body = stripMarkers('<<<OL>>>', '<<<OL>>>', t);
    return { kind: 'ol', body };
  }
  return { kind: 'text', body: p };
}

/** Lines like `1. …` → item text (supports multi-line items if we extend later). */
export function parseNumberedListItems(body: string): string[] {
  const items: string[] = [];
  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (m) items.push(m[2]);
  }
  return items;
}

function splitHighlightChunks(text: string, phrases: string[]): { text: string; mark: boolean }[] {
  if (!phrases.length) return [{ text, mark: false }];
  const chunks: { text: string; mark: boolean }[] = [];
  let rest = text;
  while (rest.length) {
    let bestIdx = -1;
    let bestLen = 0;
    for (const p of phrases) {
      if (!p) continue;
      const i = rest.indexOf(p);
      if (i >= 0 && (bestIdx < 0 || i < bestIdx || (i === bestIdx && p.length > bestLen))) {
        bestIdx = i;
        bestLen = p.length;
      }
    }
    if (bestIdx < 0) {
      chunks.push({ text: rest, mark: false });
      break;
    }
    if (bestIdx > 0) {
      chunks.push({ text: rest.slice(0, bestIdx), mark: false });
    }
    chunks.push({ text: rest.slice(bestIdx, bestIdx + bestLen), mark: true });
    rest = rest.slice(bestIdx + bestLen);
  }
  return chunks;
}

type RichProps = {
  text: string;
  glossary: GlossaryEntry[];
  readingMode: ReadingMode;
  highlightPhrases: string[];
  onTermClick: (def: string) => void;
};

function renderRichText({
  text,
  glossary,
  readingMode,
  highlightPhrases,
  onTermClick,
}: RichProps): ReactNode {
  if (readingMode === 'highlight' && highlightPhrases.length > 0) {
    return splitHighlightChunks(text, highlightPhrases).map((chunk, i) =>
      chunk.mark ? (
        <mark
          key={i}
          className="rounded-sm bg-amber-500/25 px-0.5 text-amber-50 ring-1 ring-amber-400/25"
        >
          <GlossaryText
            text={chunk.text}
            glossary={glossary}
            readingMode="original"
            onTermClick={onTermClick}
          />
        </mark>
      ) : (
        <GlossaryText
          key={i}
          text={chunk.text}
          glossary={glossary}
          readingMode="original"
          onTermClick={onTermClick}
        />
      ),
    );
  }
  return (
    <GlossaryText
      text={text}
      glossary={glossary}
      readingMode={readingMode}
      onTermClick={onTermClick}
    />
  );
}

/** Renders `qz` as q with subscript z (like q_z in math), then `=` and the definition. */
function renderDefListLine(
  content: string,
  renderRich: (text: string) => ReactNode,
): ReactNode {
  const qzEq = content.match(/^qz\s*=\s*(.*)$/);
  if (qzEq) {
    const rhs = qzEq[1] ?? '';
    return (
      <span className="inline leading-[1.75]">
        <span className="font-mono text-[0.98em] tracking-tight text-zinc-100">
          q<sub className="text-[0.68em] font-mono">z</sub>
        </span>
        <span className="mx-1.5 font-mono text-zinc-100">=</span>
        <span className="font-sans text-[1.05rem] text-zinc-200">{renderRich(rhs)}</span>
      </span>
    );
  }
  return renderRich(content);
}

type Props = {
  body: string;
  glossary: GlossaryEntry[];
  readingMode: ReadingMode;
  highlightPhrases: string[];
  onTermClick: (def: string) => void;
};

export function WhitepaperParagraphBlock({ body, glossary, readingMode, highlightPhrases, onTermClick }: Props) {
  const parsed = parseParagraphBody(body);
  const rich = (text: string) =>
    renderRichText({ text, glossary, readingMode, highlightPhrases, onTermClick });
  const defListLine = (content: string) => renderDefListLine(content, rich);

  if (parsed.kind === 'code') {
    return (
      <pre className="my-4 overflow-x-auto rounded-lg border border-zinc-600 bg-[#0a1018] p-4 text-[13px] leading-relaxed text-zinc-100 font-mono text-left">
        {parsed.body}
      </pre>
    );
  }
  if (parsed.kind === 'table') {
    return (
      <pre className="my-4 overflow-x-auto rounded-lg border border-zinc-600 bg-[#0a1018] p-4 text-[12px] leading-snug text-zinc-100 font-mono whitespace-pre">
        {parsed.body}
      </pre>
    );
  }

  if (parsed.kind === 'deflist') {
    const lines = parsed.body.split('\n').filter((l) => l.trim().length > 0);
    return (
      <div
        dir="ltr"
        className="my-4 space-y-2 rounded-lg border border-zinc-600/80 bg-[#0a1018]/45 px-4 py-3 text-left text-[1.05rem] leading-[1.75] text-zinc-100"
        role="group"
        aria-label="Definitions"
      >
        {lines.map((line, i) => {
          const indent = /^\s{2,}/.test(line);
          const content = line.trim();
          return (
            <div
              key={i}
              className={
                indent
                  ? 'ml-3 pl-1 text-[0.98rem] text-zinc-200'
                  : undefined
              }
            >
              {defListLine(content)}
            </div>
          );
        })}
      </div>
    );
  }

  if (parsed.kind === 'eq') {
    const formula = parsed.body.trim();
    return (
      <div className="my-4 flex justify-center sm:justify-start">
        <code className="rounded-md border border-zinc-600 bg-[#0a1018] px-4 py-2.5 font-mono text-[1.05rem] leading-snug text-zinc-100 shadow-sm">
          {rich(formula)}
        </code>
      </div>
    );
  }

  if (parsed.kind === 'ol') {
    const items = parseNumberedListItems(parsed.body);
    if (!items.length) return null;
    return (
      <ol className="mb-5 ml-6 list-decimal space-y-2 pl-1 text-[1.05rem] leading-[1.75] text-zinc-100 marker:text-zinc-400">
        {items.map((item, i) => (
          <li key={i} className="pl-1">
            {rich(item)}
          </li>
        ))}
      </ol>
    );
  }

  const inner = rich(parsed.body);

  return (
    <p className="mb-5 whitespace-pre-line text-[1.05rem] leading-[1.75] text-zinc-100">{inner}</p>
  );
}
