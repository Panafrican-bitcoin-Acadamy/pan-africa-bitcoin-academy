'use client';

interface SeedPhraseGridProps {
  words: string[];
  columns?: number;
}

export function SeedPhraseGrid({ words, columns = 4 }: SeedPhraseGridProps) {
  return (
    <div className="my-6 rounded-lg border border-zinc-700/50 bg-zinc-900/50 p-4 sm:p-6 shadow-inner">
      <div 
        className="grid gap-3" 
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {words.map((word, index) => (
          <div
            key={index}
            className="flex items-center gap-2 rounded-md border border-zinc-700/30 bg-zinc-950/50 p-2.5 sm:p-3 transition hover:border-cyan-500/30 hover:bg-zinc-900/50 hover:shadow-sm"
          >
            <span className="text-xs font-semibold text-zinc-500 sm:text-sm min-w-[2rem] tabular-nums">
              {index + 1}.
            </span>
            <code className="flex-1 font-mono text-sm font-medium text-cyan-300 sm:text-base break-all">
              {word}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}

