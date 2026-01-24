'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { downloadICalFile } from '@/lib/icalExport';
import { EventEditModal } from './EventEditModal';
import { SessionEditModal } from './SessionEditModal';

// Cohort color palette - distinct colors for different cohorts
const cohortColors = [
  { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-300', dot: 'bg-blue-500/50' },
  { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-300', dot: 'bg-purple-500/50' },
  { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-300', dot: 'bg-cyan-500/50' },
  { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-300', dot: 'bg-green-500/50' },
  { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-300', dot: 'bg-yellow-500/50' },
  { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-300', dot: 'bg-orange-500/50' },
  { bg: 'bg-pink-500/20', border: 'border-pink-500/50', text: 'text-pink-300', dot: 'bg-pink-500/50' },
  { bg: 'bg-indigo-500/20', border: 'border-indigo-500/50', text: 'text-indigo-300', dot: 'bg-indigo-500/50' },
  { bg: 'bg-teal-500/20', border: 'border-teal-500/50', text: 'text-teal-300', dot: 'bg-teal-500/50' },
  { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-300', dot: 'bg-rose-500/50' },
];

// Get consistent color for a cohort based on its ID
function getCohortColor(cohortId: string | null | undefined): typeof cohortColors[0] {
  if (!cohortId) {
    return cohortColors[0]; // Default to first color
  }
  
  // Simple hash function to get consistent index from cohort ID
  let hash = 0;
  for (let i = 0; i < cohortId.length; i++) {
    hash = ((hash << 5) - hash) + cohortId.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const index = Math.abs(hash) % cohortColors.length;
  return cohortColors[index];
}

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'live-class' | 'assignment' | 'community' | 'workshop' | 'deadline' | 'quiz' | 'cohort';
  time?: string;
  link?: string;
  recordingUrl?: string; // Recording/replay URL for sessions
  description?: string;
  duration?: number; // Duration in minutes for iCal export
  cohortId?: string | null; // For admin edit modal
  cohortColor?: { bg: string; border: string; text: string; dot: string }; // Cohort-specific color
}

// No fallback events - show empty calendar if API fails

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
  studentId?: string | null; // Student profile ID for fetching their sessions
  showCohorts?: boolean; // Show cohort start/end dates as events (admin mode)
  email?: string; // Student email for fetching their sessions (fallback)
}

export function Calendar({ cohortId, studentId, showCohorts = false, email }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'list'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [sessionEditModalOpen, setSessionEditModalOpen] = useState(false);
  const [sessionsMap, setSessionsMap] = useState<Map<string, any>>(new Map());
  const [cohorts, setCohorts] = useState<Array<{ id: string; name: string }>>([]);

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
              cohortId: event.cohortId || event.cohort_id || null,
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
          } else if (cohortId) {
            // Priority: Use cohortId if available (more direct)
            sessionsUrl = `/api/sessions?cohortId=${encodeURIComponent(cohortId)}`;
            console.log('📅 Calendar: Fetching sessions for cohortId:', cohortId);
            if (email) {
              console.log('📅 Calendar: Email also available:', email, '- using cohortId for direct lookup');
            }
          } else if (email) {
            // Fallback: fetch sessions for enrolled cohorts using email
            sessionsUrl = `/api/sessions?email=${encodeURIComponent(email)}`;
            console.log('📅 Calendar: Fetching sessions for student email:', email);
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
                // Store sessions in a Map for later access when editing
                const newSessionsMap = new Map<string, any>();
                
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
                    
                    // Store original session data in Map
                    const sessionEventId = `session-${session.id}`;
                    newSessionsMap.set(sessionEventId, session);
                    
                    const cohortId = session.cohort_id || session.cohorts?.id;
                    const cohortColor = getCohortColor(cohortId);
                    
                    return {
                      id: sessionEventId,
                      title: `${cohortName} - Session ${session.session_number}${session.topic ? `: ${session.topic}` : ''}`,
                      date: sessionDate,
                      type: 'live-class' as const,
                      time: session.duration_minutes ? `${session.duration_minutes} min` : '60 min',
                      link: session.link || '#',
                      recordingUrl: session.recording_url || undefined,
                      description: session.topic || `Cohort session ${session.session_number}`,
                      duration: session.duration_minutes || 60,
                      cohortId: cohortId,
                      cohortColor: cohortColor,
                    };
                  });
                
                setSessionsMap(newSessionsMap);
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
          console.warn('⚠️ Calendar: No valid events found');
          setEvents([]);
        }
      } catch (err: any) {
        console.error('❌ Calendar: Error fetching events:', err);
        setError(err.message);
        // Show empty calendar on error
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [cohortId, studentId, showCohorts, email]);

  // Fetch cohorts for admin edit modal
  useEffect(() => {
    if (showCohorts) {
      fetch('/api/cohorts')
        .then((res) => res.json())
        .then((data) => {
          if (data.cohorts && Array.isArray(data.cohorts)) {
            setCohorts(data.cohorts.map((c: any) => ({ id: c.id, name: c.name })));
          }
        })
        .catch((err) => console.error('Error fetching cohorts:', err));
    }
  }, [showCohorts]);

  const handleEventClick = (event: CalendarEvent) => {
    if (!showCohorts) return; // Only allow editing in admin mode
    
    if (event.id.startsWith('session-')) {
      // Handle session editing
      const session = sessionsMap.get(event.id);
      if (session) {
        setSelectedSession(session);
        setSessionEditModalOpen(true);
      }
    } else if (!event.id.startsWith('cohort-')) {
      // Handle regular event editing (not cohort dates)
      setSelectedEvent(event);
      setEditModalOpen(true);
    }
  };

  const handleEventUpdate = () => {
    // Refresh events and sessions after update
    const fetchEventsRefresh = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const url = showCohorts
          ? '/api/admin/events/all'
          : cohortId 
          ? `/api/events?cohort_id=${encodeURIComponent(cohortId)}`
          : '/api/events';
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.status}`);
        }
        const data = await response.json();
        
        let transformedEvents: CalendarEvent[] = [];
        
        if (data.events && Array.isArray(data.events)) {
          transformedEvents = data.events
            .filter((event: any) => {
              if (!event.date) return false;
              const eventDate = new Date(event.date);
              return !isNaN(eventDate.getTime());
            })
            .map((event: any) => ({
              id: event.id,
              title: event.title,
              date: new Date(event.date),
              type: event.type || 'community',
              time: event.time || '',
              link: event.link || '#',
              description: event.description || '',
              cohortId: event.cohortId || event.cohort_id || null,
            }));
        }
        
        // Fetch cohort sessions (same logic as main fetchEvents)
        try {
          let sessionsUrl: string | null = null;
          
          if (showCohorts) {
            sessionsUrl = '/api/sessions?admin=true';
          } else if (cohortId) {
            sessionsUrl = `/api/sessions?cohortId=${encodeURIComponent(cohortId)}`;
          } else if (email) {
            sessionsUrl = `/api/sessions?email=${encodeURIComponent(email)}`;
          }

          if (sessionsUrl) {
            const sessionsResponse = await fetch(sessionsUrl);
            
            if (sessionsResponse.ok) {
              const sessionsData = await sessionsResponse.json();
              
              if (sessionsData.sessions && Array.isArray(sessionsData.sessions)) {
                const newSessionsMap = new Map<string, any>();
                
                const sessionEvents: CalendarEvent[] = sessionsData.sessions
                  .filter((session: any) => {
                    if (!session.session_date) return false;
                    const sessionDate = new Date(session.session_date);
                    return !isNaN(sessionDate.getTime());
                  })
                  .map((session: any) => {
                    const cohortName = session.cohorts?.name || 'Cohort';
                    const cohortId = session.cohort_id || session.cohorts?.id;
                    const sessionDate = new Date(session.session_date);
                    sessionDate.setHours(0, 0, 0, 0);
                    
                    // Get cohort-specific color
                    const cohortColor = getCohortColor(cohortId);
                    
                    const sessionEventId = `session-${session.id}`;
                    newSessionsMap.set(sessionEventId, session);
                    
                    return {
                      id: sessionEventId,
                      title: `${cohortName} - Session ${session.session_number}${session.topic ? `: ${session.topic}` : ''}`,
                      date: sessionDate,
                      type: 'live-class' as const,
                      time: session.duration_minutes ? `${session.duration_minutes} min` : '60 min',
                      link: session.link || '#',
                      recordingUrl: session.recording_url || undefined,
                      description: session.topic || `Cohort session ${session.session_number}`,
                      duration: session.duration_minutes || 60,
                      cohortId: cohortId,
                      cohortColor: cohortColor,
                    };
                  });
                
                setSessionsMap(newSessionsMap);
                transformedEvents = [...transformedEvents, ...sessionEvents];
              }
            }
          }
        } catch (sessionsErr: any) {
          console.error('Error fetching sessions on refresh:', sessionsErr);
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
            console.warn('Error fetching cohorts on refresh:', cohortsErr);
            // Continue without cohort events
          }
        }
        
        setEvents(transformedEvents);
      } catch (err: any) {
        console.error('Error fetching events:', err);
        setError(err.message);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEventsRefresh();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Get events for selected date, sorted with recordings first
  const getEventsForDate = (date: Date) => {
    const dateEvents = events.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
    );
    
    // Sort: sessions with recordings first, then other sessions, then other events
    return dateEvents.sort((a, b) => {
      const aHasRecording = !!(a.id.startsWith('session-') && a.recordingUrl);
      const bHasRecording = !!(b.id.startsWith('session-') && b.recordingUrl);
      const aIsSession = a.id.startsWith('session-');
      const bIsSession = b.id.startsWith('session-');
      
      // Sessions with recordings come first
      if (aHasRecording && !bHasRecording) return -1;
      if (!aHasRecording && bHasRecording) return 1;
      
      // Then other sessions
      if (aIsSession && !bIsSession) return -1;
      if (!aIsSession && bIsSession) return 1;
      
      // Then by date/time
      return a.date.getTime() - b.date.getTime();
    });
  };

  // Check if a date has a session (live-class event with session- prefix)
  const hasSession = (date: Date) => {
    const dateEvents = getEventsForDate(date);
    return dateEvents.some(
      (event) => event.type === 'live-class' && event.id.startsWith('session-')
    );
  };

  // Get upcoming events (all future, sorted with recordings first, then by date/time)
  const getUpcomingEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events
      .filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate.getTime() >= today.getTime();
      })
      .sort((a, b) => {
        const aHasRecording = !!(a.id.startsWith('session-') && a.recordingUrl);
        const bHasRecording = !!(b.id.startsWith('session-') && b.recordingUrl);
        const aIsSession = a.id.startsWith('session-');
        const bIsSession = b.id.startsWith('session-');
        
        // Sessions with recordings come first
        if (aHasRecording && !bHasRecording) return -1;
        if (!aHasRecording && bHasRecording) return 1;
        
        // Then other sessions
        if (aIsSession && !bIsSession) return -1;
        if (!aIsSession && bIsSession) return 1;
        
        // Then by date/time
        return a.date.getTime() - b.date.getTime();
      })
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
                const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
                const isSunday = dayOfWeek === 0;
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
                const hasSessionOnDate = hasSession(date);

                // Build className with priority: Sunday (disabled) > Today > Selected > Session > Default
                let cellClassName = 'aspect-square rounded border p-0.5 text-[10px] transition ';
                if (isSunday) {
                  // Sunday: disabled/unusable
                  cellClassName += 'border-zinc-800 bg-zinc-950/50 text-zinc-600 cursor-not-allowed opacity-50';
                } else if (isToday) {
                  // Today with session: combine orange (today) with blue (session) accent
                  cellClassName += hasSessionOnDate
                    ? 'border-orange-500 bg-blue-500/30 text-orange-300 font-semibold'
                    : 'border-orange-500 bg-orange-500/20 text-orange-300 font-semibold';
                } else if (isSelected) {
                  // Selected with session: combine cyan (selected) with blue (session) accent
                  cellClassName += hasSessionOnDate
                    ? 'border-cyan-500 bg-blue-500/30 text-cyan-300'
                    : 'border-cyan-500 bg-cyan-500/20 text-cyan-300';
                } else if (hasSessionOnDate) {
                  // Session date: blue background
                  cellClassName += 'border-blue-500/50 bg-blue-500/25 text-blue-200 hover:border-blue-500 hover:bg-blue-500/35';
                } else {
                  // Default
                  cellClassName += 'border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800';
                }

                return (
                  <button
                    key={day}
                    onClick={() => !isSunday && setSelectedDate(date)}
                    disabled={isSunday}
                    className={cellClassName}
                    title={isSunday ? 'Sundays are not available for scheduling' : undefined}
                  >
                    <div className="text-center leading-none">{day}</div>
                    {dayEvents.length > 0 && (
                      <div className="mt-0.5 flex flex-wrap gap-0.5">
                        {dayEvents.slice(0, 3).map((event) => {
                          // Use cohort color for sessions, otherwise use event type color
                          const colorClass = event.id.startsWith('session-') && event.cohortColor
                            ? event.cohortColor.bg
                            : eventTypeColors[event.type].split(' ')[0];
                          return (
                            <div
                              key={event.id}
                              className={`h-0.5 w-full rounded ${colorClass}`}
                              title={event.title}
                            />
                          );
                        })}
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
                {getEventsForDate(selectedDate).map((event) => {
                  // Use cohort color for sessions, otherwise use event type color
                  const colorClasses = event.id.startsWith('session-') && event.cohortColor
                    ? `${event.cohortColor.bg} ${event.cohortColor.border} ${event.cohortColor.text}`
                    : eventTypeColors[event.type];
                  return (
                  <div
                    key={event.id}
                    className={`rounded border p-1 text-xs ${colorClasses} ${
                      showCohorts && !event.id.startsWith('session-') && !event.id.startsWith('cohort-')
                        ? 'cursor-pointer hover:brightness-110'
                        : ''
                    }`}
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="truncate font-medium">{event.title}</span>
                          {/* Show recording link first if available */}
                          {event.type === 'live-class' && event.recordingUrl && event.recordingUrl.trim() !== '' && (
                            <a
                              href={event.recordingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-medium text-purple-300 bg-purple-500/20 border border-purple-500/50 hover:bg-purple-500/30 transition"
                              onClick={(e) => e.stopPropagation()}
                              title="Watch Recording/Replay"
                            >
                              📹 Replay
                            </a>
                          )}
                          {/* Then show live link if available */}
                          {event.type === 'live-class' && event.link && event.link !== '#' && event.link.trim() !== '' && (
                            <a
                              href={event.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-medium text-blue-300 bg-blue-500/20 border border-blue-500/50 hover:bg-blue-500/30 transition"
                              onClick={(e) => e.stopPropagation()}
                              title="Join Video Call"
                            >
                              Join Video
                            </a>
                          )}
                        </div>
                        {event.time && <div className="text-xs text-zinc-400">{event.time}</div>}
                      </div>
                      <a
                        href={generateGoogleCalendarLink(event)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 rounded px-1 py-0.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                        title="Add to Google Calendar"
                        onClick={(e) => e.stopPropagation()}
                      >
                        +G
                      </a>
                    </div>
                  </div>
                  );
                })}
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
          {getUpcomingEvents().map((event) => {
            // Use cohort color for sessions, otherwise use event type color
            const colorClasses = event.id.startsWith('session-') && event.cohortColor
              ? `${event.cohortColor.bg} ${event.cohortColor.border} ${event.cohortColor.text}`
              : eventTypeColors[event.type];
            return (
            <div
              key={event.id}
              className={`rounded border p-1.5 ${colorClasses} ${
                showCohorts && !event.id.startsWith('session-') && !event.id.startsWith('cohort-')
                  ? 'cursor-pointer hover:brightness-110'
                  : ''
              }`}
              onClick={() => handleEventClick(event)}
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
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-medium truncate">{event.title}</span>
                    {/* Show recording link first if available */}
                    {event.type === 'live-class' && event.recordingUrl && event.recordingUrl.trim() !== '' && (
                      <a
                        href={event.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-medium text-purple-300 bg-purple-500/20 border border-purple-500/50 hover:bg-purple-500/30 transition"
                        onClick={(e) => e.stopPropagation()}
                        title="Watch Recording/Replay"
                      >
                        📹 Replay
                      </a>
                    )}
                    {/* Then show live link if available */}
                    {event.type === 'live-class' && event.link && event.link !== '#' && event.link.trim() !== '' && (
                      <a
                        href={event.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-medium text-blue-300 bg-blue-500/20 border border-blue-500/50 hover:bg-blue-500/30 transition"
                        onClick={(e) => e.stopPropagation()}
                        title="Join Video Call"
                      >
                        Join Video
                      </a>
                    )}
                  </div>
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
            );
          })}
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

      {/* Event Edit Modal - Only for admin mode */}
      {showCohorts && (
        <>
          <EventEditModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedEvent(null);
            }}
            event={selectedEvent ? {
              id: selectedEvent.id,
              title: selectedEvent.title,
              type: selectedEvent.type,
              date: selectedEvent.date,
              time: selectedEvent.time,
              link: selectedEvent.link,
              description: selectedEvent.description,
              cohortId: selectedEvent.cohortId || null,
            } : null}
            cohorts={cohorts}
            onUpdate={handleEventUpdate}
          />
          
          <SessionEditModal
            isOpen={sessionEditModalOpen}
            onClose={() => {
              setSessionEditModalOpen(false);
              setSelectedSession(null);
            }}
            session={selectedSession}
            onUpdate={handleEventUpdate}
          />
        </>
      )}
    </div>
  );
}

