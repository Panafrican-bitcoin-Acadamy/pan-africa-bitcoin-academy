import React from 'react';
import { formStyles, cn } from '@/lib/styles';

interface FormGridProps {
  children: React.ReactNode;
  cols?: 1 | 2;
  className?: string;
}

export function FormGrid({ children, cols = 2, className }: FormGridProps) {
  const gridClasses = cols === 1 ? formStyles.gridSingle : formStyles.grid;
  
  return (
    <div className={cn(gridClasses, className)}>
      {children}
    </div>
  );
}
