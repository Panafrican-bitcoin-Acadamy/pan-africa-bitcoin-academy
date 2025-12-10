'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'live-class' | 'assignment' | 'community' | 'workshop' | 'deadline' | 'quiz' | 'cohort';
  time?: string;
  link?: string;
  description?: string;
}

// Fallback mock events (dated relative to "now") used if API fails
const createFallbackEvents = (): CalendarEvent[] => {
  const now = new Date();
  const d1 = new Date(now);
  const d2 = new Date(now);
  d1.setDate(now.getDate() + 1);
  d2.setDate(now.getDate() + 2);
  return [
    {
      id: 'fallback-1',
      title: 'Live Class - Welcome Session',
      date: d1,
      type: 'live-class',
      time: '7:00 PM',
      link: '#',
    },
    {
      id: 'fallback-2',
      title: 'Office Hours with Mentors',
      date: d2,
      type: 'community',
      time: '6:00 PM',
      link: '#',
    },
  ];
};

const eventTypeColors = {
  'live-class': 'bg-blue-500/20 border-blue-500/50 text-blue-300',
  assignment: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
  community: 'bg-purple-500/20 border-purple-500/50 text-purple-300',
  workshop: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300',
  deadline: 'bg-red-500/20 border-red-500/50 text-red-300',
  quiz: 'bg-orange-500/20 border-orange-500/50 text-orange-300',
  cohort: 'bg-green-500/20 border-green-500/50 text-green-300',
};

const eventTypeLabels = {
  'live-class': 'Live Class',
  assignment: 'Assignment',
  community: 'Community',
  workshop: 'Workshop',
  deadline: 'Deadline',
  quiz: 'Quiz',
  cohort: 'Cohort',
};

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'list'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>(createFallbackEvents());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: Fetch events from Supabase
  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        setError(null);
        // TODO: Replace with Supabase query
        // const response = await fetch('/api/notion/events');
        // if (!response.ok) {
        //   throw new Error(`Failed to fetch events: ${response.status}`);
        // }
        // const data = await response.json();
        // For now, use empty array until Supabase is implemented
        const data = { events: [] };
        
        if (data.events && Array.isArray(data.events)) {
          // Transform API events (date is ISO string) to CalendarEvent format
          const transformedEvents: CalendarEvent[] = data.events.map((event: any) => ({
            id: event.id,
            title: event.title,
            date: new Date(event.date),
            type: event.type,
            time: event.time,
            link: event.link || '#',
            description: event.description,
          }));
          
          setEvents(transformedEvents);
        } else {
          // If no events or invalid format, use fallback
          setEvents(createFallbackEvents());
        }
      } catch (err: any) {
        console.error('Error fetching events:', err);
        setError(err.message);
        // Use fallback events on error
        setEvents(createFallbackEvents());
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Get events for selected date
  const getEventsForDate = (date: Date) => {
    return events.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
    );
  };

  // Get upcoming events (all future, sorted by date/time)
  const getUpcomingEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events
      .filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate.getTime() >= today.getTime();
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 10);
  };

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate Google Calendar link
  const generateGoogleCalendarLink = (event: CalendarEvent) => {
    const startDate = event.date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(event.date);
    endDate.setHours(event.date.getHours() + 1);
    const endDateStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${startDate}/${endDateStr}`,
      details: event.description || event.title,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="rounded-xl border border-cyan-400/25 bg-black/80 p-4 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-50">Calendar</h2>
          <p className="text-sm text-zinc-400">
            {monthNames[month]} {year}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView(view === 'month' ? 'list' : 'month')}
            className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800"
          >
            {view === 'month' ? 'List' : 'Month'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mb-4 text-center text-sm text-zinc-400">
          Loading events...
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-2 text-xs text-yellow-300">
          {error} (using fallback events)
        </div>
      )}

      {view === 'month' ? (
        <>
          {/* Month Navigation */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={previousMonth}
              className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-2 text-zinc-300 transition hover:bg-zinc-800"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-2 text-zinc-300 transition hover:bg-zinc-800"
            >
              →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="mb-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {dayNames.map((day) => (
                <div key={day} className="p-2 text-center text-xs font-medium text-zinc-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Days of the month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const date = new Date(year, month, day);
                const dayEvents = getEventsForDate(date);
                const isToday =
                  date.getDate() === new Date().getDate() &&
                  date.getMonth() === new Date().getMonth() &&
                  date.getFullYear() === new Date().getFullYear();
                const isSelected =
                  selectedDate &&
                  date.getDate() === selectedDate.getDate() &&
                  date.getMonth() === selectedDate.getMonth() &&
                  date.getFullYear() === selectedDate.getFullYear();

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    className={`aspect-square rounded-lg border p-1 text-xs transition ${
                      isToday
                        ? 'border-orange-500 bg-orange-500/20 text-orange-300 font-semibold'
                        : isSelected
                        ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                        : 'border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="text-center">{day}</div>
                    {dayEvents.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={`h-1 w-full rounded ${
                              eventTypeColors[event.type].split(' ')[0]
                            }`}
                            title={event.title}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="h-1 w-full rounded bg-zinc-600" title="More events" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Events */}
          {selectedDate && (
            <div className="mb-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-cyan-300">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2">
                {getEventsForDate(selectedDate).map((event) => (
                  <div
                    key={event.id}
                    className={`rounded-lg border p-2 text-xs ${eventTypeColors[event.type]}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{event.title}</div>
                        {event.time && <div className="text-zinc-400">{event.time}</div>}
                      </div>
                      <a
                        href={generateGoogleCalendarLink(event)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded px-2 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                        title="Add to Google Calendar"
                      >
                        + Google
                      </a>
                    </div>
                  </div>
                ))}
                {getEventsForDate(selectedDate).length === 0 && (
                  <div className="text-center text-sm text-zinc-500">No events</div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        /* List View */
        <div className="space-y-2">
          {getUpcomingEvents().map((event) => (
            <div
              key={event.id}
              className={`rounded-lg border p-3 ${eventTypeColors[event.type]}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-400">
                      {event.date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="text-xs text-zinc-500">•</span>
                    <span className="text-xs font-medium">{eventTypeLabels[event.type]}</span>
                    {event.time && (
                      <>
                        <span className="text-xs text-zinc-500">•</span>
                        <span className="text-xs text-zinc-300">{event.time}</span>
                      </>
                    )}
                  </div>
                  <div className="font-medium">{event.title}</div>
                  {event.description && (
                    <div className="mt-1 text-xs text-zinc-400 line-clamp-2">{event.description}</div>
                  )}
                </div>
                <a
                  href={generateGoogleCalendarLink(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 rounded px-2 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                  title="Add to Google Calendar"
                >
                  + Google
                </a>
              </div>
            </div>
          ))}
          {getUpcomingEvents().length === 0 && (
            <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-3 text-center text-sm text-zinc-400">
              No upcoming events
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 border-t border-zinc-700 pt-4">
        <div className="mb-2 text-xs font-medium text-zinc-400">Event Types</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-blue-500/50" />
            <span className="text-zinc-300">Live Class</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-yellow-500/50" />
            <span className="text-zinc-300">Assignment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-purple-500/50" />
            <span className="text-zinc-300">Community</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-red-500/50" />
            <span className="text-zinc-300">Deadline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-orange-500/50" />
            <span className="text-zinc-300">Quiz</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-green-500/50" />
            <span className="text-zinc-300">Cohort</span>
          </div>
        </div>
      </div>
    </div>
  );
}

