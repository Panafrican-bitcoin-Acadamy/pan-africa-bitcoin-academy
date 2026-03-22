"use client";

import { useEffect, useRef, useState } from "react";
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const current = OPTIONS.find((o) => o.value === language) ?? OPTIONS[0];

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-400/5 text-zinc-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 ${
          compact ? "px-2.5 py-2 text-sm" : "px-2.5 py-1.5 text-xs sm:text-sm"
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        <Languages className={`shrink-0 text-cyan-300/90 ${compact ? "h-5 w-5" : "h-4 w-4"}`} />
        <span className="font-medium tabular-nums">{current.short}</span>
        <ChevronDown
          className={`shrink-0 text-zinc-400 transition ${open ? "rotate-180" : ""} ${compact ? "h-4 w-4" : "h-3.5 w-3.5"}`}
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
                setLanguage(opt.value);
                setOpen(false);
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
    </div>
  );
}
