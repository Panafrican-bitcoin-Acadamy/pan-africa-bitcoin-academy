'use client';

import { useEffect, useState, useRef } from 'react';

export type BlurTextAnimateBy = 'words' | 'chars';
export type BlurTextDirection = 'top' | 'bottom' | 'left' | 'right';

export interface BlurTextProps {
  text: string;
  delay?: number;
  animateBy?: BlurTextAnimateBy;
  direction?: BlurTextDirection;
  onAnimationComplete?: () => void;
  className?: string;
}

const BLUR_DISTANCE = 12;
const ANIMATION_DURATION = 950;
const STAGGER_MS = 130;

export function BlurText({
  text,
  delay = 0,
  animateBy = 'words',
  direction = 'top',
  onAnimationComplete,
  className = '',
}: BlurTextProps) {
  const [mounted, setMounted] = useState(false);
  const totalRef = useRef(0);
  const units = animateBy === 'words' ? text.split(/\s+/) : text.split('');
  totalRef.current = units.length;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const getTransform = (i: number) => {
    if (!mounted) {
      switch (direction) {
        case 'top':
          return `translateY(-${BLUR_DISTANCE}px)`;
        case 'bottom':
          return `translateY(${BLUR_DISTANCE}px)`;
        case 'left':
          return `translateX(-${BLUR_DISTANCE}px)`;
        case 'right':
          return `translateX(${BLUR_DISTANCE}px)`;
        default:
          return `translateY(-${BLUR_DISTANCE}px)`;
      }
    }
    return 'translate(0, 0)';
  };

  const handleTransitionEnd = (i: number) => () => {
    if (i === totalRef.current - 1 && onAnimationComplete) {
      onAnimationComplete();
    }
  };

  return (
    <span className={`inline-flex flex-wrap justify-center ${className}`.trim()}>
      {units.map((unit, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden"
          style={{
            transition: `filter ${ANIMATION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${ANIMATION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`,
            transitionDelay: mounted ? `${i * STAGGER_MS}ms` : '0ms',
            filter: mounted ? 'blur(0)' : 'blur(8px)',
            opacity: mounted ? 1 : 0.4,
            transform: getTransform(i),
          }}
          onTransitionEnd={handleTransitionEnd(i)}
        >
          {animateBy === 'words' ? (
            <span className="inline-block" style={{ marginRight: i < units.length - 1 ? '0.25em' : 0 }}>
              {unit}
            </span>
          ) : (
            unit
          )}
        </span>
      ))}
    </span>
  );
}
