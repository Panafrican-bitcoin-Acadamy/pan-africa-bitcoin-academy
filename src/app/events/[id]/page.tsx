import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageContainer } from '@/components/PageContainer';
import { supabaseAdmin } from '@/lib/supabase';
import { Calendar as CalendarIcon, MapPin, Users, ArrowLeft } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  description: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  event_date: string | null;
  type: string;
  is_registration_enabled: boolean;
  cohort_id: string | null;
  max_registrations: number | null;
  registration_deadline: string | null;
  link: string | null;
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

async function getEvent(eventId: string): Promise<Event | null> {
  try {
    const { data: event, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error || !event) {
      return null;
    }

    return event;
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}

async function getRegistrationCount(eventId: string): Promise<number> {
  try {
    const { count } = await supabaseAdmin
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    return count || 0;
  } catch (error) {
    console.error('Error fetching registration count:', error);
    return 0;
  }
}

type EventPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailsPage({ params }: EventPageProps) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  const startTime = event.start_time ? new Date(event.start_time) : null;
  const endTime = event.end_time ? new Date(event.end_time) : null;
  const deadline = event.registration_deadline ? new Date(event.registration_deadline) : null;
  const isDeadlinePassed = deadline && new Date() > deadline;
  const isRegistrationOpen = event.is_registration_enabled && !event.cohort_id && !isDeadlinePassed;
  const registrationCount = isRegistrationOpen ? await getRegistrationCount(id) : 0;
  const isFull = event.max_registrations && registrationCount >= event.max_registrations;

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 mb-6 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Events</span>
        </Link>

        {/* Event Header */}
        <div className="mb-8">
          <div className="mb-4">
            <span className="inline-flex items-center rounded-md px-3 py-1 text-sm font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              {EVENT_TYPE_LABELS[event.type] || event.type}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-zinc-50 mb-4">{event.name}</h1>
        </div>

        {/* Event Details Card */}
        <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/30 p-6 mb-6">
          <div className="space-y-4">
            {startTime && (
              <div className="flex items-start gap-3">
                <CalendarIcon className="h-5 w-5 text-zinc-500 mt-0.5" />
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Date & Time</p>
                  <p className="text-zinc-200">
                    {startTime.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {startTime.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    }) && (
                      <span className="text-zinc-400">
                        {' '}
                        at {startTime.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </span>
                    )}
                    {endTime && (
                      <span className="text-zinc-400">
                        {' '}
                        - {endTime.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-zinc-500 mt-0.5" />
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Location</p>
                  <p className="text-zinc-200">{event.location}</p>
                </div>
              </div>
            )}

            {isRegistrationOpen && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-zinc-500 mt-0.5" />
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Registrations</p>
                  <p className="text-zinc-200">
                    {registrationCount} {event.max_registrations ? `of ${event.max_registrations}` : ''} registered
                    {isFull && <span className="text-red-400 ml-2">(Full)</span>}
                  </p>
                </div>
              </div>
            )}

            {deadline && (
              <div className="flex items-start gap-3">
                <CalendarIcon className="h-5 w-5 text-zinc-500 mt-0.5" />
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Registration Deadline</p>
                  <p className={`text-zinc-200 ${isDeadlinePassed ? 'text-red-400' : ''}`}>
                    {deadline.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {isDeadlinePassed && <span className="ml-2">(Passed)</span>}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/30 p-6 mb-6">
            <h2 className="text-xl font-semibold text-zinc-50 mb-4">About This Event</h2>
            <p className="text-zinc-300 whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* Registration Section */}
        {event.cohort_id ? (
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/30 p-6 text-center">
            <p className="text-zinc-400">This event is for cohort members only.</p>
          </div>
        ) : !event.is_registration_enabled ? (
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/30 p-6 text-center">
            <p className="text-zinc-400">Registration is not available for this event.</p>
          </div>
        ) : isDeadlinePassed ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <p className="text-red-300">Registration deadline has passed.</p>
          </div>
        ) : isFull ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <p className="text-red-300 mb-4">This event is full.</p>
            <p className="text-sm text-zinc-400">
              {registrationCount} of {event.max_registrations} spots are taken.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-6 text-center">
            <h3 className="text-xl font-semibold text-orange-300 mb-4">Ready to Join?</h3>
            <p className="text-zinc-300 mb-6">
              Register now to secure your spot at this event.
            </p>
            <Link
              href={`/events/${id}/register`}
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-3 text-base font-semibold text-white transition hover:brightness-110"
            >
              Register for Event
            </Link>
          </div>
        )}

        {/* Event Link (if available) */}
        {event.link && (
          <div className="mt-6 text-center">
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/50 px-6 py-3 text-base font-semibold text-zinc-300 transition hover:bg-zinc-800"
            >
              View Event Link
            </a>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

