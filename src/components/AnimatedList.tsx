'use client';

import { ReactNode } from 'react';
import { AnimatedSection } from './AnimatedSection';

interface AnimatedListProps {
  children: ReactNode[];
  animation?: 'slideUp' | 'slideLeft' | 'fadeIn';
  staggerDelay?: number;
  className?: string;
}

export function AnimatedList({
  children,
  animation = 'slideUp',
  staggerDelay = 100,
  className = '',
}: AnimatedListProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <AnimatedSection
          key={index}
          animation={animation}
          delay={index * staggerDelay}
        >
          {child}
        </AnimatedSection>
      ))}
    </div>
  );
}

