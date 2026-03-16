'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/styles';

type HeadingTag = 'h1' | 'h2' | 'h3';

interface AnimatedHeadingProps {
  as: HeadingTag;
  children: ReactNode;
  className?: string;
  /** Optional delay in ms before animation runs when in view */
  delay?: number;
}

export function AnimatedHeading({ as: Tag, children, className = '', delay = 0 }: AnimatedHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [inView, setInView] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const h = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1, rootMargin: '-20px 0px -20px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [prefersReducedMotion]);

  const show = inView || prefersReducedMotion;
  const animateClass = show && !prefersReducedMotion ? 'animate-heading-reveal' : 'animate-heading-initial';

  return (
    <Tag
      ref={ref}
      className={cn(animateClass, className)}
      style={show && !prefersReducedMotion && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
