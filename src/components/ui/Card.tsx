import React from 'react';
import { cardStyles, cn } from '@/lib/styles';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'base' | 'selected' | 'info' | 'highlight' | 'badge';
  children: React.ReactNode;
}

export function Card({
  variant = 'base',
  className,
  children,
  ...props
}: CardProps) {
  const baseClasses = cardStyles[variant];

  return (
    <div
      className={cn(baseClasses, className)}
      {...props}
    >
      {children}
    </div>
  );
}
