import React from 'react';
import { buttonStyles, cn } from '@/lib/styles';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'outline' | 'selected' | 'small' | 'danger';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  className,
  children,
  ...props
}: ButtonProps) {
  const baseClasses = buttonStyles[variant];

  return (
    <button
      className={cn(baseClasses, className)}
      {...props}
    >
      {children}
    </button>
  );
}
