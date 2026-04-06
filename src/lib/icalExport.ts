/**
 * iCal Export Utility
 * Generates iCal (.ics) file format for calendar events
 */

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  /** Prefer for DTSTART when present (actual instant from API) */
  startAt?: Date;
  type?: string;
  time?: string;
  link?: string;
  description?: string;
  duration?: number; // Duration in minutes
}

/**
 * Format date for iCal (YYYYMMDDTHHMMSSZ)
 */
function formatICalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape text for iCal format
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate iCal content from calendar events
 */
export function generateICalContent(events: CalendarEvent[]): string {
  const now = new Date();
  const nowFormatted = formatICalDate(now);

  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pan-Africa Bitcoin Academy//Session Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ].join('\r\n');

  events.forEach((event) => {
    const startDate = new Date(event.startAt ?? event.date);
    // Default to 2:00 PM if no time specified
    if (!event.time) {
      startDate.setHours(14, 0, 0, 0);
    } else {
      // Try to parse time if provided (e.g., "7:00 PM" or "14:00")
      const timeMatch = event.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const ampm = timeMatch[3]?.toUpperCase();

        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;

        startDate.setHours(hours, minutes, 0, 0);
      }
    }

    const endDate = new Date(startDate);
    // Default duration: 90 minutes for sessions, 60 minutes for other events
    const durationMinutes = event.duration || (event.type === 'live-class' ? 90 : 60);
    endDate.setMinutes(endDate.getMinutes() + durationMinutes);

    const startFormatted = formatICalDate(startDate);
    const endFormatted = formatICalDate(endDate);

    const title = escapeICalText(event.title);
    const description = event.description
      ? escapeICalText(event.description)
      : escapeICalText(event.title);
    const location = event.link && event.link !== '#' ? escapeICalText(event.link) : '';

    ical += '\r\n';
    ical += 'BEGIN:VEVENT';
    ical += `\r\nUID:${event.id}@panafricanbitcoin.com`;
    ical += `\r\nDTSTAMP:${nowFormatted}`;
    ical += `\r\nDTSTART:${startFormatted}`;
    ical += `\r\nDTEND:${endFormatted}`;
    ical += `\r\nSUMMARY:${title}`;
    if (description) {
      ical += `\r\nDESCRIPTION:${description}`;
    }
    if (location) {
      ical += `\r\nLOCATION:${location}`;
    }
    if (event.link && event.link !== '#') {
      ical += `\r\nURL:${event.link}`;
    }
    ical += '\r\nSTATUS:CONFIRMED';
    ical += '\r\nSEQUENCE:0';
    ical += '\r\nEND:VEVENT';
  });

  ical += '\r\nEND:VCALENDAR';

  return ical;
}

/**
 * Download iCal file
 */
export function downloadICalFile(events: CalendarEvent[], filename: string = 'cohort-sessions.ics') {
  const icalContent = generateICalContent(events);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
