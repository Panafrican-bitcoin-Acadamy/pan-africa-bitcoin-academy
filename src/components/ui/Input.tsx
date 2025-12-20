import React from 'react';
import { inputStyles, cn } from '@/lib/styles';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'base' | 'phone' | 'date' | 'optional';
  label?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
}

export function Input({
  variant = 'base',
  label,
  required,
  error,
  helpText,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const baseClasses = variant === 'phone' 
    ? inputStyles.phone 
    : variant === 'date'
    ? inputStyles.date
    : variant === 'optional'
    ? inputStyles.optional
    : inputStyles.base;

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-zinc-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={cn(baseClasses, error && 'border-red-400/50', className)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-red-300" role="alert">
          {error}
        </p>
      )}
      {helpText && !error && (
        <p id={`${inputId}-help`} className="mt-1 text-xs text-zinc-400">
          {helpText}
        </p>
      )}
    </div>
  );
}
