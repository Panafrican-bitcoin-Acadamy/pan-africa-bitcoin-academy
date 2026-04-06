/**
 * Calendar grid needs a "calendar day" in the user's locale, not a shifted UTC midnight.
 * DB often stores YYYY-MM-DD or ...T00:00:00.000Z meaning "this calendar date", which
 * `new Date()` interprets as UTC and can show as the previous local day in the Americas.
 */

function tailAfterYmd(ymdMatchLen: number, s: string): string {
  return s.slice(ymdMatchLen).replace(/^ /, 'T');
}

/**
 * True when the stored value is only a calendar date (no meaningful clock time / zone intent).
 */
function isDateOnlyOrUtcMidnight(ymd: RegExpExecArray, full: string): boolean {
  const rest = tailAfterYmd(ymd[0].length, full);
  if (rest === '') return true;
  // UTC / offset midnight, or clockless midnight (common for DATE / serialized session day)
  return (
    /^T00:00:00(\.\d+)?Z$/i.test(rest) ||
    /^T00:00:00(\.\d+)?\+00:?00$/i.test(rest) ||
    /^T00:00:00(\.\d+)?-00:?00$/i.test(rest) ||
    /^T00:00:00(\.\d+)?$/i.test(rest)
  );
}

/**
 * Local midnight on the intended calendar day (for month-grid cells and day matching).
 */
export function toLocalCalendarDate(input: string | Date): Date {
  let s: string;
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return input;
    s = input.toISOString();
  } else {
    s = String(input).trim();
  }

  if (!s) {
    return new Date(NaN);
  }

  const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!ymd) {
    const dt = new Date(s);
    if (Number.isNaN(dt.getTime())) return dt;
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  }

  const y = parseInt(ymd[1], 10);
  const m = parseInt(ymd[2], 10) - 1;
  const d = parseInt(ymd[3], 10);

  if (isDateOnlyOrUtcMidnight(ymd, s)) {
    return new Date(y, m, d);
  }

  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) {
    return new Date(y, m, d);
  }
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

export function isSameLocalCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** First weekday index when weeks start on Monday (0 = Mon, …, 6 = Sun). */
export function getMondayBasedWeekdayIndex(jsSundayBasedDay: number): number {
  return (jsSundayBasedDay + 6) % 7;
}
