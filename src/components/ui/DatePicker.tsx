'use client';

import React from 'react';
import DatePickerLib from 'react-datepicker';
import { CalendarIcon } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import { cn } from '@/lib/styles';

export interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showTime?: boolean;
  timeIntervals?: number;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  inputClassName?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

const baseInputClasses =
  'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 pl-10 text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors';

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date...',
  showTime = false,
  timeIntervals = 15,
  minDate,
  maxDate,
  className,
  inputClassName,
  label,
  required,
  disabled,
}: DatePickerProps) {
  const parsedDate = value ? (showTime ? new Date(value) : new Date(value + 'T12:00:00')) : null;

  const handleChange = (date: Date | null) => {
    if (!date) {
      onChange('');
      return;
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    if (showTime) {
      const y = date.getFullYear();
      const m = pad(date.getMonth() + 1);
      const d = pad(date.getDate());
      const h = pad(date.getHours());
      const min = pad(date.getMinutes());
      onChange(`${y}-${m}-${d}T${h}:${min}`);
    } else {
      onChange(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`);
    }
  };

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="mb-2 block text-xs font-medium text-zinc-400">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 pointer-events-none z-10" />
        <DatePickerLib
          selected={parsedDate}
          onChange={handleChange}
          showTimeSelect={showTime}
          timeIntervals={timeIntervals}
          timeCaption="Time"
          dateFormat={showTime ? 'MMM d, yyyy h:mm aa' : 'MMM d, yyyy'}
          placeholderText={placeholder}
          minDate={minDate}
          maxDate={maxDate}
          disabled={disabled}
          className={cn(baseInputClasses, inputClassName)}
          calendarClassName="datepicker-calendar-dark"
          wrapperClassName="w-full"
          popperPlacement="bottom-start"
          popperClassName="datepicker-popper"
          popperModifiers={[
            {
              name: 'offset',
              options: { offset: [0, 4] },
            },
          ]}
        />
      </div>
    </div>
  );
}
