"use client";

import TextType from "@/components/TextType";

const KEYS_QUOTE_LINES = ["Not your keys, not your coins."];

export function KeysChapterHeroQuote() {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-cyan-400/40 bg-zinc-950/95 px-4 py-4 sm:px-8 sm:py-5"
      style={{
        boxShadow:
          "0 0 48px rgba(34, 211, 238, 0.16), 0 0 100px rgba(168, 85, 247, 0.09), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
      }}
      aria-label='Quote: "Not your keys, not your coins."'
    >
      <div
        className="pointer-events-none absolute -left-24 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full bg-cyan-400/18 blur-3xl keys-quote-glow-a"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 top-0 h-40 w-40 rounded-full bg-fuchsia-500/18 blur-3xl keys-quote-glow-b"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent keys-quote-shimmer" aria-hidden />

      <div className="relative z-[1] mx-auto max-w-3xl text-center">
        <span
          className="pointer-events-none absolute left-0.5 top-0 font-serif text-4xl leading-none text-cyan-400/70 sm:left-2 sm:text-5xl keys-quote-mark-left"
          aria-hidden
        >
          &ldquo;
        </span>
        <span
          className="pointer-events-none absolute bottom-0 right-0.5 font-serif text-4xl leading-none text-orange-400/70 sm:right-2 sm:text-5xl keys-quote-mark-right"
          aria-hidden
        >
          &rdquo;
        </span>

        <div className="relative z-10 flex justify-center px-4 sm:px-10 md:px-14">
          <TextType
            texts={KEYS_QUOTE_LINES}
            typingSpeed={75}
            pauseDuration={1800}
            deletingSpeed={50}
            showCursor
            cursorCharacter="_"
            cursorBlinkDuration={0.5}
            variableSpeedEnabled={false}
            variableSpeedMin={60}
            variableSpeedMax={120}
            className="justify-center text-base font-semibold tracking-tight sm:text-lg md:text-xl lg:text-2xl"
            displayClassName="bg-gradient-to-r from-cyan-200 via-amber-100 to-fuchsia-200 bg-clip-text text-transparent drop-shadow-[0_0_28px_rgba(34,211,238,0.35)]"
            cursorClassName="text-amber-200"
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes keys-quote-glow-move {
          0%,
          100% {
            opacity: 0.55;
            transform: scale(1) translate(0, 0);
          }
          50% {
            opacity: 0.95;
            transform: scale(1.08) translate(6px, -4px);
          }
        }
        @keyframes keys-quote-shimmer-move {
          0% {
            opacity: 0.35;
            transform: translateX(-30%);
          }
          50% {
            opacity: 0.85;
            transform: translateX(30%);
          }
          100% {
            opacity: 0.35;
            transform: translateX(-30%);
          }
        }
        @keyframes keys-quote-mark-pulse {
          0%,
          100% {
            opacity: 0.55;
            filter: drop-shadow(0 0 12px rgba(34, 211, 238, 0.35));
          }
          50% {
            opacity: 0.9;
            filter: drop-shadow(0 0 22px rgba(251, 191, 36, 0.45));
          }
        }
        .keys-quote-glow-a {
          animation: keys-quote-glow-move 7s ease-in-out infinite;
        }
        .keys-quote-glow-b {
          animation: keys-quote-glow-move 8.5s ease-in-out infinite;
          animation-delay: 1.2s;
        }
        .keys-quote-shimmer {
          animation: keys-quote-shimmer-move 10s ease-in-out infinite;
        }
        .keys-quote-mark-left {
          animation: keys-quote-mark-pulse 5s ease-in-out infinite;
        }
        .keys-quote-mark-right {
          animation: keys-quote-mark-pulse 5.2s ease-in-out infinite;
          animation-delay: 0.4s;
        }
        @media (prefers-reduced-motion: reduce) {
          .keys-quote-glow-a,
          .keys-quote-glow-b,
          .keys-quote-shimmer,
          .keys-quote-mark-left,
          .keys-quote-mark-right {
            animation: none !important;
            opacity: 0.65;
          }
        }
      `}</style>
    </section>
  );
}
