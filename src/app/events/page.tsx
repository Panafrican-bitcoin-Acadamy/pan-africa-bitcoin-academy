import Link from 'next/link';
import { PageContainer } from '@/components/PageContainer';
import { supabaseAdmin } from '@/lib/supabase';
import { Calendar as CalendarIcon, MapPin, Users } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  description: string;
  start_time: string;
  location: string | null;
  event_date: string | null;
  type: string;
  max_registrations: number | null;
  registration_deadline: string | null;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  'live-class': 'Live Class',
  'assignment': 'Assignment',
  'community': 'Community',
  'workshop': 'Workshop',
  'deadline': 'Deadline',
  'quiz': 'Quiz',
  'cohort': 'Cohort',
};

async function getEventsWithRegistration(): Promise<Event[]> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Fetch events with registration enabled AND cohort_id IS NULL (non-cohort events only)
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('is_registration_enabled', true)
      .is('cohort_id', null)
      .gte('start_time', todayISO)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }

    return events || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export default async function EventsPage() {
  const events = await getEventsWithRegistration();

  return (
    <PageContainer
      title="Upcoming Events"
      subtitle="Join our upcoming sessions and workshops. Register to secure your spot."
    >
      {events.length === 0 ? (
        <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/30 p-12 text-center">
          <p className="text-lg text-zinc-400 mb-2">No upcoming events with registration available</p>
          <p className="text-sm text-zinc-500">Check back soon for new events!</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const startTime = event.start_time ? new Date(event.start_time) : null;
            const deadline = event.registration_deadline ? new Date(event.registration_deadline) : null;
            const isDeadlinePassed = deadline && new Date() > deadline;
            const isRegistrationOpen = !isDeadlinePassed;

            return (
              <div
                key={event.id}
                className="rounded-xl border border-zinc-700/50 bg-zinc-900/30 overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
              >
                <div className="p-6">
                  {/* Event Type Badge */}
                  <div className="mb-3">
                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                      {EVENT_TYPE_LABELS[event.type] || event.type}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-zinc-50 mb-3 line-clamp-2">
                    {event.name}
                  </h3>

                  {/* Description */}
                  {event.description && (
                    <p className="text-sm text-zinc-400 mb-4 line-clamp-3">
                      {event.description}
                    </p>
                  )}

                  {/* Event Details */}
                  <div className="space-y-2 mb-4">
                    {startTime && (
                      <div className="flex items-center gap-2 text-sm text-zinc-300">
                        <CalendarIcon className="h-4 w-4 text-zinc-500" />
                        <span>
                          {startTime.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          {startTime.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          }) && (
                            <span className="text-zinc-500">
                              {' '}
                              at {startTime.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-zinc-300">
                        <MapPin className="h-4 w-4 text-zinc-500" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.max_registrations && (
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Users className="h-4 w-4 text-zinc-500" />
                        <span>Limited to {event.max_registrations} registrations</span>
                      </div>
                    )}
                  </div>

                  {/* Registration Status and Button */}
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-zinc-700/50">
                    {isRegistrationOpen ? (
                      <>
                        <span className="text-xs text-green-400">Registration Open</span>
                        <Link
                          href={`/events/${event.id}/register`}
                          className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                        >
                          Register
                        </Link>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-red-400">Registration Closed</span>
                        <span className="text-xs text-zinc-500">Deadline passed</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}

