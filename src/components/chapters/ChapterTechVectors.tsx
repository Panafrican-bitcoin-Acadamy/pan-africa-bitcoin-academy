"use client";

/**
 * Bitcoin/crypto-themed tech vectors for chapter pages.
 * Renders circuit lines, blockchain-style blocks, Bitcoin symbol, and node grids
 * to give a technological, Bitcoin-related feel without distracting from content.
 */

export function ChapterTechVectors() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
      aria-hidden
    >
      {/* Top-right: Bitcoin symbol (₿ style) – tech accent */}
      <div className="absolute -right-4 -top-4 h-24 w-24 opacity-[0.09] sm:h-32 sm:w-32 sm:opacity-[0.12]">
        <svg viewBox="0 0 64 64" fill="none" className="h-full w-full text-amber-400">
          <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <line x1="28" y1="20" x2="28" y2="44" stroke="currentColor" strokeWidth="2" strokeOpacity="0.8" />
          <line x1="36" y1="20" x2="36" y2="44" stroke="currentColor" strokeWidth="2" strokeOpacity="0.8" />
          <path d="M30 24h4c4.5 0 7 2.5 7 6.5s-2.5 6.5-7 6.5h-4V24zm0 14h4c3 0 5-2 5-5s-2-5-5-5h-4v10z" fill="currentColor" fillOpacity="0.7" />
        </svg>
      </div>

      {/* Top-left: small blockchain blocks (chain of 3) */}
      <div className="absolute -left-2 top-4 h-16 w-20 opacity-[0.08] sm:opacity-[0.11]">
        <svg viewBox="0 0 60 40" fill="none" className="h-full w-full text-cyan-400">
          <rect x="2" y="4" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="0.8" fill="none" />
          <rect x="22" y="4" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="0.8" fill="none" />
          <rect x="42" y="4" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="0.8" fill="none" />
          <line x1="18" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.7" />
          <line x1="38" y1="10" x2="42" y2="10" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.7" />
          <rect x="8" y="24" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.7" />
          <rect x="26" y="24" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.7" />
        </svg>
      </div>

      {/* Bottom-left: circuit / node grid – tech mesh */}
      <div className="absolute -bottom-6 -left-6 h-28 w-28 opacity-[0.08] sm:h-36 sm:w-36 sm:opacity-[0.12]">
        <svg viewBox="0 0 80 80" fill="none" className="h-full w-full text-orange-500">
          {[12, 32, 52, 68].map((x) =>
            [12, 32, 52, 68].map((y) => (
              <circle key={`n-${x}-${y}`} cx={x} cy={y} r="2.5" fill="currentColor" />
            ))
          )}
          <path
            d="M12 12h20M32 12v20M32 32h20M52 32v20M52 52h16M32 52v-20M32 32h-20"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeOpacity="0.6"
          />
        </svg>
      </div>

      {/* Bottom-right: hash/data style lines */}
      <div className="absolute -bottom-4 -right-4 h-20 w-24 opacity-[0.06] sm:opacity-[0.09]">
        <svg viewBox="0 0 48 40" fill="none" className="h-full w-full text-cyan-400">
          <path d="M4 8h8M20 8h8M36 8h6M4 20h12M22 20h10M38 20h6M4 32h6M16 32h14M36 32h8" stroke="currentColor" strokeWidth="1" strokeOpacity="0.8" />
        </svg>
      </div>

      {/* Right edge: vertical tech line accent (cyan) */}
      <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />

      {/* Left edge: vertical accent (orange/bitcoin) */}
      <div className="absolute left-0 top-1/3 bottom-1/3 h-1/3 w-px bg-gradient-to-b from-transparent via-amber-500/15 to-transparent" />

      {/* Very subtle grid overlay – tech feel */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34, 211, 238, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
}
