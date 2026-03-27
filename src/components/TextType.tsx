"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type Phase = "typing" | "deleting";

export type TextTypeProps = {
  /** Lines to cycle through (preferred) */
  texts?: string[];
  /** Alternate prop name (React Bits style) */
  text?: string[];
  typingSpeed?: number;
  pauseDuration?: number;
  showCursor?: boolean;
  cursorCharacter?: string;
  deletingSpeed?: number;
  variableSpeedEnabled?: boolean;
  variableSpeedMin?: number;
  variableSpeedMax?: number;
  cursorBlinkDuration?: number;
  className?: string;
  /** Classes for the typed characters only (e.g. gradient text) */
  displayClassName?: string;
  cursorClassName?: string;
};

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export default function TextType({
  texts,
  text,
  typingSpeed = 75,
  pauseDuration = 1500,
  showCursor = true,
  cursorCharacter = "_",
  deletingSpeed = 50,
  variableSpeedEnabled = false,
  variableSpeedMin = 60,
  variableSpeedMax = 120,
  cursorBlinkDuration = 0.5,
  className = "",
  displayClassName = "",
  cursorClassName = "",
}: TextTypeProps) {
  const lines = texts?.length ? texts : text ?? [];
  const linesKey = lines.join("\u0000");
  const linesRef = useRef(lines);
  linesRef.current = lines;

  const timingRef = useRef({
    typingSpeed,
    pauseDuration,
    deletingSpeed,
    variableSpeedEnabled,
    variableSpeedMin,
    variableSpeedMax,
  });
  timingRef.current = {
    typingSpeed,
    pauseDuration,
    deletingSpeed,
    variableSpeedEnabled,
    variableSpeedMin,
    variableSpeedMax,
  };

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    const arr = linesRef.current;
    if (!arr.length) return;

    if (reducedMotion) {
      setDisplayed(arr[0]);
      return;
    }

    let cancelled = false;
    let phraseIdx = 0;
    let current = "";
    let phase: Phase = "typing";
    let timeoutId: ReturnType<typeof setTimeout>;

    const lineAt = (i: number) => {
      const a = linesRef.current;
      return a[i % a.length];
    };

    const charDelay = (base: number) => {
      const t = timingRef.current;
      if (!t.variableSpeedEnabled) return base;
      return Math.floor(
        t.variableSpeedMin +
          Math.random() * (t.variableSpeedMax - t.variableSpeedMin + 1),
      );
    };

    /** Runs until the component unmounts or the tab/document goes away (effect cleanup). */
    const step = () => {
      if (cancelled) return;
      const t = timingRef.current;
      const full = lineAt(phraseIdx);

      if (phase === "typing") {
        if (current.length < full.length) {
          current = full.slice(0, current.length + 1);
          setDisplayed(current);
          timeoutId = setTimeout(step, charDelay(t.typingSpeed));
        } else {
          timeoutId = setTimeout(() => {
            phase = "deleting";
            step();
          }, t.pauseDuration);
        }
      } else {
        if (current.length > 0) {
          current = full.slice(0, current.length - 1);
          setDisplayed(current);
          timeoutId = setTimeout(step, t.deletingSpeed);
        } else {
          phraseIdx = (phraseIdx + 1) % linesRef.current.length;
          phase = "typing";
          timeoutId = setTimeout(step, 280);
        }
      }
    };

    current = "";
    setDisplayed("");
    phraseIdx = 0;
    phase = "typing";
    timeoutId = setTimeout(step, charDelay(timingRef.current.typingSpeed));

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // Intentionally only linesKey + reducedMotion: timing props update via timingRef
    // so the type/delete loop is not reset on every parent re-render — it runs until unmount.
  }, [linesKey, reducedMotion]);

  if (!lines.length) return null;

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-0.5 ${className}`}>
      <span className={displayClassName} aria-live="polite">
        {displayed}
      </span>
      {showCursor && !reducedMotion ? (
        <span
          className={`inline-block translate-y-px font-mono text-cyan-200/90 ${cursorClassName}`.trim()}
          style={{
            animation: `text-type-cursor-blink ${cursorBlinkDuration}s step-end infinite`,
          }}
        >
          {cursorCharacter}
        </span>
      ) : null}
    </span>
  );
}
