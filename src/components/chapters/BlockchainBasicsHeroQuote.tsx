"use client";

import TextType from "@/components/TextType";

const BLOCKCHAIN_QUOTE_LINES = ["Don't trust, verify."];

export function BlockchainBasicsHeroQuote() {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-purple-400/40 bg-zinc-950/95 px-4 py-4 sm:px-8 sm:py-5"
      style={{
        boxShadow:
          "0 0 48px rgba(168, 85, 247, 0.16), 0 0 100px rgba(34, 211, 238, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
      }}
      aria-label='Quote: Do not trust, verify.'
    >
      <div
        className="pointer-events-none absolute -left-24 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full bg-purple-500/20 blur-3xl bc-quote-glow-a"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 top-0 h-40 w-40 rounded-full bg-cyan-400/18 blur-3xl bc-quote-glow-b"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/55 to-transparent bc-quote-shimmer" aria-hidden />

      <div className="relative z-[1] mx-auto max-w-3xl text-center">
        <span
          className="pointer-events-none absolute left-0.5 top-0 font-serif text-4xl leading-none text-purple-400/75 sm:left-2 sm:text-5xl bc-quote-mark-left"
          aria-hidden
        >
          &ldquo;
        </span>
        <span
          className="pointer-events-none absolute bottom-0 right-0.5 font-serif text-4xl leading-none text-cyan-400/70 sm:right-2 sm:text-5xl bc-quote-mark-right"
          aria-hidden
        >
          &rdquo;
        </span>

        <div className="relative z-10 flex justify-center px-4 sm:px-10 md:px-14">
          <TextType
            texts={BLOCKCHAIN_QUOTE_LINES}
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
            displayClassName="bg-gradient-to-r from-fuchsia-200 via-cyan-200 to-violet-200 bg-clip-text text-transparent drop-shadow-[0_0_28px_rgba(168,85,247,0.35)]"
            cursorClassName="text-cyan-200"
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes bc-quote-glow-move {
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
        @keyframes bc-quote-shimmer-move {
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
        @keyframes bc-quote-mark-pulse {
          0%,
          100% {
            opacity: 0.55;
            filter: drop-shadow(0 0 12px rgba(168, 85, 247, 0.4));
          }
          50% {
            opacity: 0.9;
            filter: drop-shadow(0 0 22px rgba(34, 211, 238, 0.45));
          }
        }
        .bc-quote-glow-a {
          animation: bc-quote-glow-move 7s ease-in-out infinite;
        }
        .bc-quote-glow-b {
          animation: bc-quote-glow-move 8.5s ease-in-out infinite;
          animation-delay: 1.2s;
        }
        .bc-quote-shimmer {
          animation: bc-quote-shimmer-move 10s ease-in-out infinite;
        }
        .bc-quote-mark-left {
          animation: bc-quote-mark-pulse 5s ease-in-out infinite;
        }
        .bc-quote-mark-right {
          animation: bc-quote-mark-pulse 5.2s ease-in-out infinite;
          animation-delay: 0.4s;
        }
        @media (prefers-reduced-motion: reduce) {
          .bc-quote-glow-a,
          .bc-quote-glow-b,
          .bc-quote-shimmer,
          .bc-quote-mark-left,
          .bc-quote-mark-right {
            animation: none !important;
            opacity: 0.65;
          }
        }
      `}</style>
    </section>
  );
}
