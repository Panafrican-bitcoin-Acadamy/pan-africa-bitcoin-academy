'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { downloadICalFile } from '@/lib/icalExport';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'live-class' | 'assignment' | 'community' | 'workshop' | 'deadline' | 'quiz' | 'cohort';
  time?: string;
  link?: string;
  description?: string;
  duration?: number; // Duration in minutes for iCal export
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

interface CalendarProps {
  cohortId?: string | null;
  showCohorts?: boolean; // Show cohort start/end dates as events (admin mode)
  email?: string; // Student email for fetching their sessions
}

export function Calendar({ cohortId, showCohorts = false, email }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'list'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>(createFallbackEvents());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch events from Supabase, filtered by cohort if provided
  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        setError(null);
        
        // Build URL - use admin endpoint if showCohorts is true (admin mode)
        const url = showCohorts
          ? '/api/admin/events/all'
          : cohortId 
          ? `/api/events?cohort_id=${encodeURIComponent(cohortId)}`
          : '/api/events';
        
        console.log('📅 Calendar: Fetching events from:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.status}`);
        }
        const data = await response.json();
        
        console.log('📅 Calendar: Received events data:', {
          eventsCount: data.events?.length || 0,
          hasEvents: !!data.events,
          isArray: Array.isArray(data.events),
        });
        
        let transformedEvents: CalendarEvent[] = [];
        
        if (data.events && Array.isArray(data.events)) {
          // Transform API events (date is ISO string) to CalendarEvent format
          transformedEvents = data.events
            .filter((event: any) => {
              // Only include events with valid dates
              if (!event.date) {
                console.warn('⚠️ Event missing date:', event);
                return false;
              }
              const eventDate = new Date(event.date);
              if (isNaN(eventDate.getTime())) {
                console.warn('⚠️ Event has invalid date:', event);
                return false;
              }
              return true;
            })
            .map((event: any) => ({
              id: event.id,
              title: event.title,
              date: new Date(event.date),
              type: event.type || 'community',
              time: event.time || '',
              link: event.link || '#',
              description: event.description || '',
            }));
        }
        
        // Fetch cohort sessions
        // For students: fetch sessions based on their enrolled cohorts (using email)
        // For admins: fetch all sessions
        try {
          let sessionsUrl: string | null = null;
          
          if (showCohorts) {
            // Admin mode: fetch all sessions
            sessionsUrl = '/api/sessions?admin=true';
            console.log('📅 Calendar: Admin mode - fetching all sessions');
          } else if (email) {
            // Student mode: fetch sessions for enrolled cohorts using email
            sessionsUrl = `/api/sessions?email=${encodeURIComponent(email)}`;
            console.log('📅 Calendar: Fetching sessions for student email:', email);
          } else if (cohortId) {
            // Fallback: if cohortId is provided but no email, we can't fetch sessions
            // Sessions are tied to student enrollments, not just cohortId
            console.warn('⚠️ Calendar: cohortId provided but no email - cannot fetch sessions without email');
          } else {
            console.log('📅 Calendar: No email or cohortId provided - skipping session fetch');
          }

          if (sessionsUrl) {
            console.log('📅 Calendar: Fetching sessions from:', sessionsUrl);
            const sessionsResponse = await fetch(sessionsUrl);
            
            if (sessionsResponse.ok) {
              const sessionsData = await sessionsResponse.json();
              console.log('📅 Calendar: Sessions API response:', {
                hasSessions: !!sessionsData.sessions,
                sessionsCount: sessionsData.sessions?.length || 0,
                isArray: Array.isArray(sessionsData.sessions),
                error: sessionsData.error
              });
              
              if (sessionsData.error) {
                console.warn('⚠️ Calendar: Sessions API returned error:', sessionsData.error);
              }
              
              if (sessionsData.sessions && Array.isArray(sessionsData.sessions)) {
                const sessionEvents: CalendarEvent[] = sessionsData.sessions
                  .filter((session: any) => {
                    if (!session.session_date) {
                      console.warn('⚠️ Calendar: Session missing session_date:', session);
                      return false;
                    }
                    const sessionDate = new Date(session.session_date);
                    if (isNaN(sessionDate.getTime())) {
                      console.warn('⚠️ Calendar: Session has invalid date:', session.session_date);
                      return false;
                    }
                    return true;
                  })
                  .map((session: any) => {
                    const cohortName = session.cohorts?.name || 'Cohort';
                    const sessionDate = new Date(session.session_date);
                    // Format date to ensure proper timezone handling
                    sessionDate.setHours(0, 0, 0, 0);
                    return {
                      id: `session-${session.id}`,
                      title: `${cohortName} - Session ${session.session_number}${session.topic ? `: ${session.topic}` : ''}`,
                      date: sessionDate,
                      type: 'live-class' as const,
                      time: session.duration_minutes ? `${session.duration_minutes} min` : '',
                      link: session.link || '#',
                      description: session.topic || `Cohort session ${session.session_number}`,
                      duration: session.duration_minutes || 90,
                    };
                  });
                
                transformedEvents = [...transformedEvents, ...sessionEvents];
                console.log(`✅ Calendar: Added ${sessionEvents.length} session events from cohort_sessions table`);
                
                if (sessionEvents.length === 0 && sessionsData.sessions.length > 0) {
                  console.warn('⚠️ Calendar: Sessions returned but none passed validation');
                }
              } else {
                console.log('📅 Calendar: No sessions array in response or empty array');
              }
            } else {
              const errorText = await sessionsResponse.text().catch(() => 'Unable to read error');
              console.error('❌ Calendar: Failed to fetch sessions:', {
                status: sessionsResponse.status,
                statusText: sessionsResponse.statusText,
                error: errorText
              });
            }
          } else {
            console.log('📅 Calendar: No sessions URL - email or admin mode required');
          }
        } catch (sessionsErr: any) {
          console.error('❌ Calendar: Error fetching sessions:', {
            message: sessionsErr.message,
            stack: sessionsErr.stack
          });
          // Continue without session events
        }

        // If showCohorts is true, fetch and add cohort dates
        if (showCohorts) {
          try {
            const cohortsResponse = await fetch('/api/cohorts');
            if (cohortsResponse.ok) {
              const cohortsData = await cohortsResponse.json();
              if (cohortsData.cohorts && Array.isArray(cohortsData.cohorts)) {
                const cohortEvents: CalendarEvent[] = [];
                
                cohortsData.cohorts.forEach((cohort: any) => {
                  // Add cohort start date
                  if (cohort.startDate) {
                    const startDate = new Date(cohort.startDate);
                    if (!isNaN(startDate.getTime())) {
                      cohortEvents.push({
                        id: `cohort-start-${cohort.id}`,
                        title: `${cohort.name} - Start`,
                        date: startDate,
                        type: 'cohort',
                        time: '',
                        link: '#',
                        description: `Cohort ${cohort.name} starts (${cohort.level || ''} - ${cohort.status || ''})`,
                      });
                    }
                  }
                  
                  // Add cohort end date
                  if (cohort.endDate) {
                    const endDate = new Date(cohort.endDate);
                    if (!isNaN(endDate.getTime())) {
                      cohortEvents.push({
                        id: `cohort-end-${cohort.id}`,
                        title: `${cohort.name} - End`,
                        date: endDate,
                        type: 'cohort',
                        time: '',
                        link: '#',
                        description: `Cohort ${cohort.name} ends`,
                      });
                    }
                  }
                });
                
                transformedEvents = [...transformedEvents, ...cohortEvents];
              }
            }
          } catch (cohortsErr) {
            console.warn('⚠️ Calendar: Error fetching cohorts:', cohortsErr);
            // Continue without cohort events
          }
        }
        
        console.log('📅 Calendar: Transformed events:', transformedEvents.length);
        
        if (transformedEvents.length > 0) {
          setEvents(transformedEvents);
          console.log('✅ Calendar: Events loaded successfully');
        } else {
          console.warn('⚠️ Calendar: No valid events found, using fallback');
          setEvents(createFallbackEvents());
        }
      } catch (err: any) {
        console.error('❌ Calendar: Error fetching events:', err);
        setError(err.message);
        // Use fallback events on error
        setEvents(createFallbackEvents());
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [cohortId, showCohorts, email]);

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
    <div className="rounded-xl border border-cyan-400/25 bg-black/80 p-2 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
      {/* Header */}
      <div className="mb-1.5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-50">Calendar</h2>
          <p className="text-xs text-zinc-400">
            {monthNames[month]} {year}
          </p>
        </div>
        <div className="flex gap-1.5">
          {/* Download Calendar button - only for students */}
          {email && !showCohorts && events.length > 0 && (
            <button
              onClick={() => {
                const sessionEvents = events.filter(e => e.type === 'live-class' && e.id.startsWith('session-'));
                if (sessionEvents.length > 0) {
                  downloadICalFile(sessionEvents, 'cohort-sessions.ics');
                } else {
                  // Download all events if no sessions found
                  downloadICalFile(events, 'calendar-events.ics');
                }
              }}
              className="flex items-center gap-1 rounded border border-cyan-500/50 bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/20"
              title="Download calendar (iCal format)"
            >
              <Download className="h-3 w-3" />
              Download
            </button>
          )}
          <button
            onClick={() => setView(view === 'month' ? 'list' : 'month')}
            className="rounded border border-zinc-700 bg-zinc-900/50 px-1.5 py-0.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800"
          >
            {view === 'month' ? 'List' : 'Month'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mb-1.5 text-center text-xs text-zinc-400">
          Loading events...
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="mb-1.5 rounded border border-yellow-500/30 bg-yellow-500/10 p-1 text-xs text-yellow-300">
          {error} (using fallback events)
        </div>
      )}

      {view === 'month' ? (
        <>
          {/* Month Navigation */}
          <div className="mb-1.5 flex items-center justify-between">
            <button
              onClick={previousMonth}
              className="rounded border border-zinc-700 bg-zinc-900/50 p-1 text-zinc-300 transition hover:bg-zinc-800"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/20"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="rounded border border-zinc-700 bg-zinc-900/50 p-1 text-zinc-300 transition hover:bg-zinc-800"
            >
              →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="mb-1.5">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-0.5">
              {dayNames.map((day) => (
                <div key={day} className="p-0.5 text-center text-xs font-medium text-zinc-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-0.5">
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
                    className={`aspect-square rounded border p-0.5 text-[10px] transition ${
                      isToday
                        ? 'border-orange-500 bg-orange-500/20 text-orange-300 font-semibold'
                        : isSelected
                        ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                        : 'border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="text-center leading-none">{day}</div>
                    {dayEvents.length > 0 && (
                      <div className="mt-0.5 flex flex-wrap gap-0.5">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={`h-0.5 w-full rounded ${
                              eventTypeColors[event.type].split(' ')[0]
                            }`}
                            title={event.title}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="h-0.5 w-full rounded bg-zinc-600" title="More events" />
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
            <div className="mb-1.5 rounded border border-cyan-500/30 bg-cyan-500/10 p-1.5">
              <div className="mb-0.5 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-cyan-300">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  ×
                </button>
              </div>
              <div className="space-y-0.5">
                {getEventsForDate(selectedDate).map((event) => (
                  <div
                    key={event.id}
                    className={`rounded border p-1 text-xs ${eventTypeColors[event.type]}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium">{event.title}</div>
                        {event.time && <div className="text-xs text-zinc-400">{event.time}</div>}
                      </div>
                      <a
                        href={generateGoogleCalendarLink(event)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 rounded px-1 py-0.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                        title="Add to Google Calendar"
                      >
                        +G
                      </a>
                    </div>
                  </div>
                ))}
                {getEventsForDate(selectedDate).length === 0 && (
                  <div className="text-center text-xs text-zinc-500">No events</div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        /* List View */
        <div className="space-y-1">
          {getUpcomingEvents().map((event) => (
            <div
              key={event.id}
              className={`rounded border p-1.5 ${eventTypeColors[event.type]}`}
            >
              <div className="flex items-start justify-between gap-1">
                <div className="flex-1 min-w-0">
                  <div className="mb-0.5 flex items-center gap-1 flex-wrap">
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
                  <div className="text-xs font-medium truncate">{event.title}</div>
                  {event.description && (
                    <div className="mt-0.5 text-xs text-zinc-400 line-clamp-1">{event.description}</div>
                  )}
                </div>
                <a
                  href={generateGoogleCalendarLink(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 rounded px-1 py-0.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                  title="Add to Google Calendar"
                >
                  +G
                </a>
              </div>
            </div>
          ))}
          {getUpcomingEvents().length === 0 && (
            <div className="rounded border border-zinc-700 bg-zinc-900/50 p-1.5 text-center text-xs text-zinc-400">
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

