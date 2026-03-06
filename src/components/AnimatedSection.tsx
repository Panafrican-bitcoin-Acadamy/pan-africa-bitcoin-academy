'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

type AnimationType = 'slideUp' | 'slideLeft' | 'slideRight' | 'fadeIn';

interface AnimatedSectionProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
  /** When true, section fades out when scrolling past. Default true. */
  fadeOut?: boolean;
}

const OBSERVER_DELAY_MS = 100;

const ANIMATION_CLASS: Record<AnimationType, string> = {
  slideUp: 'home-animate-fade-up',
  slideLeft: 'home-animate-slide-left',
  slideRight: 'home-animate-slide-right',
  fadeIn: 'home-animate-fade-in',
};

export function AnimatedSection({
  children,
  animation = 'slideUp',
  delay = 0,
  duration = 950,
  className = '',
  threshold = 0.05,
  fadeOut = true,
}: AnimatedSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [canObserve, setCanObserve] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const h = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }
    const t = setTimeout(() => setCanObserve(true), OBSERVER_DELAY_MS);
    return () => clearTimeout(t);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!canObserve || prefersReducedMotion) return;
    const el = ref.current;
    if (!el) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      {
        threshold,
        rootMargin: fadeOut ? '-50px 0px -50px 0px' : '-30px 0px',
      }
    );
    observerRef.current.observe(el);
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [canObserve, prefersReducedMotion, threshold, fadeOut]);

  const show = isVisible || prefersReducedMotion;
  const useAnimation = show && !prefersReducedMotion;
  const animateClass = useAnimation ? ANIMATION_CLASS[animation] : '';
  const actualDelay = prefersReducedMotion ? 0 : delay;

  const style: React.CSSProperties = {
    opacity: show ? undefined : 0,
    transition: show ? undefined : 'opacity 0.35s ease-out',
    animationDelay: actualDelay ? `${actualDelay}ms` : undefined,
  };

  return (
    <div
      ref={ref}
      className={`${className} ${animateClass}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}

