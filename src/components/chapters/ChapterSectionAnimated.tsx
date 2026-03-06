"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface ChapterSectionAnimatedProps {
  sectionId: string;
  sectionIdx: number;
  children: ReactNode;
}

/** Delay before we start observing – ensures initial state is painted so the transition is visible */
const OBSERVER_DELAY_MS = 120;

/**
 * Wraps each chapter section with a technological scroll-reveal animation.
 * Sections animate in (fade + slide up + slight scale) as they enter the viewport,
 * with staggered delay and a subtle tech-style border glow when visible.
 */
export function ChapterSectionAnimated({
  sectionId,
  sectionIdx,
  children,
}: ChapterSectionAnimatedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const h = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    let observer: IntersectionObserver | null = null;
    const timer = setTimeout(() => {
      const el = ref.current;
      if (!el) return;

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setIsVisible(true);
          });
        },
        {
          rootMargin: "0px 0px -60px 0px",
          threshold: 0.05,
        }
      );

      observer.observe(el);
    }, OBSERVER_DELAY_MS);

    return () => {
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, [prefersReducedMotion]);

  const delayMs = prefersReducedMotion ? 0 : Math.min(sectionIdx * 120, 600);
  const style = { transitionDelay: isVisible ? "0ms" : `${delayMs}ms` };

  const visible = isVisible || prefersReducedMotion;

  return (
    <div
      ref={ref}
      data-section-id={sectionId}
      className={
        visible ? "chapter-section-visible" : "chapter-section-initial"
      }
      style={style}
    >
      {children}
    </div>
  );
}
