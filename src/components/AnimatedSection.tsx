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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, [threshold]);

  const animationClasses = {
    slideUp: isVisible
      ? 'opacity-100 translate-y-0'
      : 'opacity-0 translate-y-10',
    slideLeft: isVisible
      ? 'opacity-100 translate-x-0'
      : 'opacity-0 -translate-x-10',
    slideRight: isVisible
      ? 'opacity-100 translate-x-0'
      : 'opacity-0 translate-x-10',
    fadeIn: isVisible ? 'opacity-100' : 'opacity-0',
  };

  return (
    <div
      ref={ref}
      className={`transition-all ease-out ${animationClasses[animation]} ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

