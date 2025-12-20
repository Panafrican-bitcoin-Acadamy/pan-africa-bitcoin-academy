import React from 'react';
import { inputStyles, cn } from '@/lib/styles';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'base' | 'small' | 'withValue';
  label?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  hasValue?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export function Select({
  variant = 'base',
  label,
  required,
  error,
  helpText,
  hasValue = false,
  options,
  className,
  id,
  ...props
}: SelectProps) {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const baseClasses = variant === 'small'
    ? inputStyles.selectSmall
    : variant === 'withValue'
    ? inputStyles.selectWithValue(hasValue)
    : inputStyles.select;

  return (
    <div>
      {label && (
        <label htmlFor={selectId} className="mb-2 block text-sm font-medium text-zinc-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={cn(baseClasses, error && 'border-red-400/50', className)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${selectId}-error` : helpText ? `${selectId}-help` : undefined}
        {...props}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className="bg-zinc-950 text-zinc-50"
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="mt-1 text-xs text-red-300" role="alert">
          {error}
        </p>
      )}
      {helpText && !error && (
        <p id={`${selectId}-help`} className="mt-1 text-xs text-zinc-400">
          {helpText}
        </p>
      )}
    </div>
  );
}
