'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Link as LinkIcon, Video, FileText, Users, GraduationCap, Rocket, Trash2, Edit, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  type: string;
  start_time: string;
  end_time: string | null;
  description: string | null;
  link: string | null;
  recording_url: string | null;
  cohort_id: string | null;
  cohort_name?: string | null;
  created_at: string;
  updated_at: string;
}

const EVENT_TYPE_ICONS: Record<string, any> = {
  'live-class': Video,
  'assignment': FileText,
  'community': Users,
  'workshop': GraduationCap,
  'deadline': Clock,
  'quiz': FileText,
  'cohort': Rocket,
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  'live-class': 'Live Class',
  'assignment': 'Assignment',
  'community': 'Community',
  'workshop': 'Workshop',
  'deadline': 'Deadline',
  'quiz': 'Quiz',
  'cohort': 'Cohort',
};

export default function EventsList({ onRefresh }: { onRefresh?: () => void }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'everyone' | 'cohort'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/events/all', {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch events');
      }

      // Transform events to match our interface
      // The API returns events with 'title' (from database 'name') and 'date' (from 'start_time')
      const transformedEvents: Event[] = (data.events || []).map((event: any) => ({
        id: event.id,
        name: event.title || 'Untitled Event',
        type: event.type || 'community',
        start_time: event.date,
        end_time: event.endTime || null,
        description: event.description || null,
        link: event.link && event.link !== '#' ? event.link : null,
        recording_url: event.recordingUrl || null,
        cohort_id: event.cohortId || null,
        cohort_name: null, // We'll fetch this separately if needed
        created_at: '',
        updated_at: '',
      }));

      setEvents(transformedEvents);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError(err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    
    // Listen for refresh event from EventForm
    const handleRefresh = () => {
      fetchEvents();
    };
    
    window.addEventListener('refreshEventsList', handleRefresh);
    
    return () => {
      window.removeEventListener('refreshEventsList', handleRefresh);
    };
  }, []);

  const handleDelete = async (eventId: string, eventName: string) => {
    if (!confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(eventId);
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete event');
      }

      // Remove from list
      setEvents(prev => prev.filter(e => e.id !== eventId));
      
      // Refresh if callback provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      console.error('Error deleting event:', err);
      alert(err.message || 'Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  const isUpcoming = (event: Event): boolean => {
    try {
      const startTime = new Date(event.start_time);
      return startTime > new Date();
    } catch {
      return false;
    }
  };

  const filteredEvents = events.filter(event => {
    // Time filter
    if (filter === 'upcoming' && !isUpcoming(event)) return false;
    if (filter === 'past' && isUpcoming(event)) return false;
    if (filter === 'everyone' && event.cohort_id !== null) return false;
    if (filter === 'cohort' && event.cohort_id === null) return false;

    // Type filter
    if (typeFilter !== 'all' && event.type !== typeFilter) return false;

    return true;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dateA = new Date(a.start_time).getTime();
    const dateB = new Date(b.start_time).getTime();
    return dateB - dateA; // Most recent first
  });

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-zinc-400">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-50 mb-2">All Events</h2>
          <p className="text-sm text-zinc-400">
            Manage and view all events in the system
          </p>
        </div>
        <button
          onClick={fetchEvents}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900 transition flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-300">Error</p>
            <p className="text-sm text-red-400/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-3">
          <label className="text-sm font-medium text-zinc-300">Filter by time:</label>
          {(['all', 'upcoming', 'past', 'everyone', 'cohort'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                filter === f
                  ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                  : 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="text-sm font-medium text-zinc-300">Filter by type:</label>
          <button
            onClick={() => setTypeFilter('all')}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              typeFilter === 'all'
                ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                : 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
            }`}
          >
            All Types
          </button>
          {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTypeFilter(value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                typeFilter === value
                  ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                  : 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Count */}
      <div className="mb-4 text-sm text-zinc-400">
        Showing {sortedEvents.length} of {events.length} events
      </div>

      {/* Events List */}
      {sortedEvents.length === 0 ? (
        <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/30 p-12 text-center">
          <Calendar className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-lg text-zinc-400 mb-2">No events found</p>
          <p className="text-sm text-zinc-500">
            {filter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first event to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map((event) => {
            const Icon = EVENT_TYPE_ICONS[event.type] || Calendar;
            const isEventUpcoming = isUpcoming(event);
            const startDate = new Date(event.start_time);
            const endDate = event.end_time ? new Date(event.end_time) : null;

            return (
              <div
                key={event.id}
                className={`rounded-lg border p-4 transition ${
                  isEventUpcoming
                    ? 'border-cyan-500/30 bg-cyan-500/5'
                    : 'border-zinc-700/50 bg-zinc-950/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`rounded-lg p-2 ${
                        isEventUpcoming ? 'bg-cyan-500/20' : 'bg-zinc-800'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          isEventUpcoming ? 'text-cyan-300' : 'text-zinc-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-zinc-100">
                            {event.name}
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            event.cohort_id
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-green-500/20 text-green-300'
                          }`}>
                            {event.cohort_id ? 'Cohort-Specific' : 'For Everyone'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-400">
                            {EVENT_TYPE_LABELS[event.type] || event.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-11 space-y-2">
                      <div className="flex items-center gap-4 text-sm text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(event.start_time)}</span>
                        </div>
                        {endDate && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            <span>Ends: {formatDate(event.end_time!)}</span>
                          </div>
                        )}
                      </div>

                      {event.description && (
                        <p className="text-sm text-zinc-400 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 flex-wrap">
                        {event.link && (
                          <a
                            href={event.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Event Link
                          </a>
                        )}
                        {event.recording_url && (
                          <a
                            href={event.recording_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition"
                          >
                            <Video className="h-3.5 w-3.5" />
                            Recording
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleDelete(event.id, event.name)}
                      disabled={deletingId === event.id}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete event"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

