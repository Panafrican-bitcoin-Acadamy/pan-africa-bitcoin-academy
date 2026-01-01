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
}

export function AnimatedSection({
  children,
  animation = 'slideUp',
  delay = 0,
  duration = 800,
  className = '',
  threshold = 0.1,
}: AnimatedSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Skip animation if user prefers reduced motion
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Disconnect after first trigger for performance
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin: '-50px 0px', // Start animation slightly before element is fully visible
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold, prefersReducedMotion]);

  // Mobile-first: Shorter, lighter animations for better performance
  const actualDuration = prefersReducedMotion ? 0 : Math.min(duration, 600);
  const actualDelay = prefersReducedMotion ? 0 : delay;

  const animationClasses = {
    slideUp: isVisible || prefersReducedMotion
      ? 'opacity-100 translate-y-0'
      : 'opacity-0 translate-y-5', // Reduced movement for mobile
    slideLeft: isVisible || prefersReducedMotion
      ? 'opacity-100 translate-x-0'
      : 'opacity-0 -translate-x-5', // Reduced movement
    slideRight: isVisible || prefersReducedMotion
      ? 'opacity-100 translate-x-0'
      : 'opacity-0 translate-x-5', // Reduced movement
    fadeIn: isVisible || prefersReducedMotion ? 'opacity-100' : 'opacity-0',
  };

  return (
    <div
      ref={ref}
      className={`transition-all ease-out ${animationClasses[animation]} ${className}`}
      style={{
        transitionDuration: `${actualDuration}ms`,
        transitionDelay: `${actualDelay}ms`,
      }}
    >
      {children}
    </div>
  );
}

