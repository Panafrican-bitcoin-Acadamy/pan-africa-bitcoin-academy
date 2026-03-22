"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Languages } from "lucide-react";
import { useLanguage, type SiteLanguage } from "@/contexts/LanguageContext";

const OPTIONS: { value: SiteLanguage; short: string; label: string }[] = [
  { value: "en", short: "EN", label: "English" },
  { value: "ti", short: "TIG", label: "ትግርኛ · Tigrinya" },
];

type LanguageSwitcherProps = {
  className?: string;
  /** Slightly smaller for mobile drawer */
  compact?: boolean;
};

export function LanguageSwitcher({
  className = "",
  compact = false,
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    if (!showComingSoon) return;
    const t = window.setTimeout(() => setShowComingSoon(false), 3000);
    return () => window.clearTimeout(t);
  }, [showComingSoon]);

  const current = OPTIONS.find((o) => o.value === language) ?? OPTIONS[0];

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center rounded-full border text-zinc-300 transition hover:border-cyan-400/35 hover:bg-cyan-400/10 hover:text-cyan-200 ${
          compact
            ? "gap-1.5 border-cyan-400/25 bg-cyan-400/5 px-2.5 py-2 text-sm"
            : "gap-1 border-cyan-400/20 bg-transparent px-2 py-1.5 text-sm leading-none"
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        <Languages
          className={`shrink-0 text-cyan-300/90 ${compact ? "h-5 w-5" : "h-3.5 w-3.5"}`}
        />
        <span className="font-medium tabular-nums">{current.short}</span>
        <ChevronDown
          className={`shrink-0 text-zinc-400 transition ${open ? "rotate-180" : ""} ${compact ? "h-4 w-4" : "h-3 w-3"}`}
        />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-[60] mt-1.5 min-w-[11rem] rounded-lg border border-cyan-400/20 bg-zinc-950/98 py-1 shadow-xl backdrop-blur-xl"
          role="listbox"
        >
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={language === opt.value}
              onClick={() => {
                setOpen(false);
                if (opt.value === "ti") {
                  setShowComingSoon(true);
                  return;
                }
                setLanguage(opt.value);
              }}
              className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-cyan-400/10 ${
                language === opt.value ? "text-cyan-200" : "text-zinc-300"
              }`}
            >
              <span>{opt.label}</span>
              <span className="text-xs font-medium text-zinc-500 tabular-nums">
                {opt.short}
              </span>
            </button>
          ))}
        </div>
      )}
      {mounted &&
        showComingSoon &&
        createPortal(
          <div
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              aria-hidden
            />
            <div className="relative w-full max-w-[min(92vw,24rem)] rounded-2xl border border-cyan-400/25 bg-zinc-950/98 px-8 py-10 text-center shadow-[0_0_48px_rgba(34,211,238,0.2),0_25px_50px_rgba(0,0,0,0.5)] sm:max-w-md sm:px-10 sm:py-12">
              <p className="text-2xl font-bold tracking-tight text-cyan-50 sm:text-3xl">
                Coming soon
              </p>
              <p className="mt-4 text-base leading-relaxed text-zinc-200 sm:text-lg">
                Tigrinya (ትግርኛ) translation is on the way.
              </p>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
