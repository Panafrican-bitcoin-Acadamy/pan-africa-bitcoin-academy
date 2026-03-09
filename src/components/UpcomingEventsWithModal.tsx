'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Video,
  Users,
  GraduationCap,
  Rocket,
  FileText,
  Calendar as CalendarIcon,
  X,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

export interface UpcomingEventForModal {
  id: string;
  title: string;
  type: string;
  dateString: string;
  time: string;
  description: string;
  link: string | null;
  image_url: string | null;
  image_alt_text: string | null;
  is_registration_enabled?: boolean;
  cohort_id?: string | null;
  /** Cohort session topic linked to chapter (from DB); show "View chapter" when set */
  chapter_slug?: string | null;
  chapter_title?: string | null;
  /** What the topic is about (chapter hook) */
  topic_detail?: string | null;
  /** What you'll learn (first few points from chapter) */
  topic_learn?: string[] | null;
  /** Chapter list layout (same as chapters list) */
  topic_theory?: string[] | null;
  topic_practice?: string[] | null;
  topic_live_session?: string | null;
  topic_quiz?: string | null;
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

const EVENT_TYPE_STYLES: Record<string, { border: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  'live-class': { border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-300', icon: Video },
  'community': { border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-300', icon: Users },
  'workshop': { border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', text: 'text-cyan-300', icon: GraduationCap },
  'cohort': { border: 'border-green-500/30', bg: 'bg-green-500/10', text: 'text-green-300', icon: Rocket },
  'assignment': { border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', text: 'text-yellow-300', icon: FileText },
};

function getEventTypeStyle(type: string) {
  return EVENT_TYPE_STYLES[type] || {
    border: 'border-zinc-500/30',
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-300',
    icon: CalendarIcon,
  };
}

export function UpcomingEventsWithModal({ events }: { events: UpcomingEventForModal[] }) {
  const [selectedEvent, setSelectedEvent] = useState<UpcomingEventForModal | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedEvent(null);
    };
    if (selectedEvent) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [mounted, selectedEvent]);

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/30 p-12 text-center">
        <p className="text-lg text-zinc-400 mb-2">No upcoming events scheduled</p>
        <p className="text-sm text-zinc-500">Check back soon for new sessions and events!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event, index) => {
          const isClosestEvent = index === 0;
          const style = getEventTypeStyle(event.type);
          const IconComponent = style.icon;
          return (
            <div
              key={event.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedEvent(event)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedEvent(event);
                }
              }}
              className={`cursor-pointer rounded-xl border overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                isClosestEvent
                  ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-500/20 via-yellow-400/15 to-yellow-500/20 shadow-[0_0_40px_rgba(234,179,8,0.4)] ring-2 ring-yellow-500/30'
                  : `${style.border} ${style.bg} hover:shadow-[0_0_30px_rgba(0,0,0,0.3)]`
              }`}
            >
              {event.image_url && (
                <div className="w-full h-48 bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center overflow-hidden relative">
                  <img
                    src={event.image_url}
                    alt={event.image_alt_text || event.title}
                    className="w-full h-full object-contain p-3"
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-950/50 to-transparent pointer-events-none" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    {isClosestEvent && (
                      <div className="mb-2">
                        <span className="inline-flex items-center rounded-full bg-yellow-500/30 px-2.5 py-1 text-xs font-semibold text-yellow-200">
                          Next Up
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <IconComponent className={`h-4 w-4 ${isClosestEvent ? 'text-yellow-300' : style.text} flex-shrink-0`} />
                      <span className={`font-medium ${isClosestEvent ? 'text-yellow-300' : style.text}`}>
                        {event.dateString}
                      </span>
                      {event.time && (
                        <>
                          <span className="text-zinc-600">•</span>
                          <span className="text-zinc-400">{event.time}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <h3 className={`mb-2 text-xl font-bold leading-tight ${isClosestEvent ? 'text-yellow-100' : 'text-zinc-50'} line-clamp-2`}>
                  {event.title}
                </h3>
                {event.chapter_title && (
                  <p className={`text-xs font-medium ${isClosestEvent ? 'text-yellow-300/90' : 'text-cyan-400'} mb-1`}>
                    Topic: {event.chapter_title}
                  </p>
                )}
                {(event.topic_theory?.length || event.topic_practice?.length || event.topic_live_session || event.topic_quiz) ? (
                  <div className="space-y-2 mb-4 text-xs">
                    {event.topic_theory && event.topic_theory.length > 0 && (
                      <div>
                        <p className="font-medium text-cyan-200 mb-0.5">📘 Theory:</p>
                        <ul className="ml-3 list-disc space-y-0.5 text-zinc-400 line-clamp-2">
                          {event.topic_theory.slice(0, 2).map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {event.topic_practice && event.topic_practice.length > 0 && (
                      <div>
                        <p className="font-medium text-orange-200 mb-0.5">🛠 Practice:</p>
                        <ul className="ml-3 list-disc space-y-0.5 text-zinc-400 line-clamp-2">
                          {event.topic_practice.slice(0, 2).map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {event.topic_live_session && (
                      <p className="font-medium text-purple-200">🎥 Live Session: <span className="font-normal text-zinc-400">{event.topic_live_session}</span></p>
                    )}
                    {event.topic_quiz && (
                      <p className="font-medium text-cyan-200">Quiz: <span className="font-normal text-zinc-400">{event.topic_quiz}</span></p>
                    )}
                  </div>
                ) : (event.topic_detail || event.description) ? (
                  <p className={`text-sm leading-relaxed ${isClosestEvent ? 'text-yellow-200/80' : 'text-zinc-400'} line-clamp-3 mb-4`}>
                    {event.topic_detail || event.description}
                  </p>
                ) : (
                  <div className="mb-4" />
                )}
                <div className="flex items-center justify-between gap-2 mt-4 flex-wrap">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${style.bg} ${style.text} border ${style.border}`}>
                    {EVENT_TYPE_LABELS[event.type] || event.type}
                  </span>
                  <div className="flex items-center gap-2">
                    {event.chapter_slug && (
                      <Link
                        href={`/chapters/${event.chapter_slug}`}
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-cyan-300 border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        View chapter
                      </Link>
                    )}
                    {event.is_registration_enabled && !event.cohort_id && (
                    <span
                      onClick={(e) => e.stopPropagation()}
                      className="inline-block"
                    >
                      <Link
                        href={`/events/${event.id}/register`}
                        className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                          isClosestEvent
                            ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30 hover:bg-yellow-500/30'
                            : 'bg-orange-500/20 text-orange-200 border border-orange-500/30 hover:bg-orange-500/30'
                        }`}
                      >
                        Register
                      </Link>
                    </span>
                  )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Event details modal - rendered via portal to document.body so it's always on top and visible */}
      {mounted && selectedEvent && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
          onClick={() => setSelectedEvent(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-modal-title"
        >
          <div
            style={{
              position: 'relative',
              zIndex: 100000,
              width: '100%',
              maxWidth: '24rem',
              maxHeight: '85vh',
              overflowY: 'auto',
              borderRadius: '12px',
              border: '2px solid #52525b',
              backgroundColor: '#18181b',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              style={{
                position: 'absolute',
                right: '8px',
                top: '8px',
                zIndex: 10,
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#3f3f46',
                color: '#d4d4d8',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close"
            >
              <X className="h-4 w-4" style={{ flexShrink: 0 }} />
            </button>

            {selectedEvent.image_url && (
              <div
                style={{
                  width: '100%',
                  height: '176px',
                  background: '#09090b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderTopLeftRadius: '10px',
                  borderTopRightRadius: '10px',
                  borderBottom: '1px solid #3f3f46',
                }}
              >
                <img
                  src={selectedEvent.image_url}
                  alt={selectedEvent.image_alt_text || selectedEvent.title}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '12px' }}
                />
              </div>
            )}

            <div style={{ padding: '1rem' }}>
              <div style={{ marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center', fontSize: '14px', color: '#d4d4d8' }}>
                <span style={{ fontWeight: 600, color: '#e4e4e7' }}>{selectedEvent.dateString}</span>
                {selectedEvent.time && (
                  <>
                    <span style={{ color: '#71717a' }}>·</span>
                    <span style={{ color: '#22d3ee', fontWeight: 500 }}>{selectedEvent.time}</span>
                  </>
                )}
              </div>
              <h2 id="event-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px', paddingRight: '2rem' }}>
                {selectedEvent.title}
              </h2>
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getEventTypeStyle(selectedEvent.type).bg} ${getEventTypeStyle(selectedEvent.type).text} border ${getEventTypeStyle(selectedEvent.type).border}`}>
                {EVENT_TYPE_LABELS[selectedEvent.type] || selectedEvent.type}
              </span>

              {(selectedEvent.chapter_title || selectedEvent.topic_theory?.length || selectedEvent.topic_practice?.length || selectedEvent.topic_live_session || selectedEvent.topic_quiz || selectedEvent.topic_detail || (selectedEvent.topic_learn && selectedEvent.topic_learn.length > 0)) && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #3f3f46' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Topic
                  </h3>
                  {selectedEvent.chapter_title && (
                    <p style={{ color: '#67e8f9', fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>
                      {selectedEvent.chapter_title}
                    </p>
                  )}
                  {(selectedEvent.topic_theory?.length || selectedEvent.topic_practice?.length || selectedEvent.topic_live_session || selectedEvent.topic_quiz) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedEvent.topic_theory && selectedEvent.topic_theory.length > 0 && (
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: '#67e8f9', marginBottom: '4px' }}>📘 Theory:</p>
                          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#d4d4d8', fontSize: '14px', lineHeight: 1.6 }}>
                            {selectedEvent.topic_theory.map((item, i) => (
                              <li key={i} style={{ marginBottom: '2px' }}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedEvent.topic_practice && selectedEvent.topic_practice.length > 0 && (
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: '#fdba74', marginBottom: '4px' }}>🛠 Practice:</p>
                          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#d4d4d8', fontSize: '14px', lineHeight: 1.6 }}>
                            {selectedEvent.topic_practice.map((item, i) => (
                              <li key={i} style={{ marginBottom: '2px' }}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedEvent.topic_live_session && (
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: '#c084fc', marginBottom: '4px' }}>🎥 Live Session:</p>
                          <p style={{ margin: 0, paddingLeft: '0', color: '#d4d4d8', fontSize: '14px', lineHeight: 1.6 }}>{selectedEvent.topic_live_session}</p>
                        </div>
                      )}
                      {selectedEvent.topic_quiz && (
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: '#67e8f9', marginBottom: '4px' }}>Quiz:</p>
                          <p style={{ margin: 0, paddingLeft: '0', color: '#d4d4d8', fontSize: '14px', lineHeight: 1.6 }}>{selectedEvent.topic_quiz}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {selectedEvent.topic_detail && (
                        <p style={{ color: '#d4d4d8', fontSize: '14px', lineHeight: 1.6, marginBottom: selectedEvent.topic_learn?.length ? '8px' : 0 }}>
                          {selectedEvent.topic_detail}
                        </p>
                      )}
                      {selectedEvent.topic_learn && selectedEvent.topic_learn.length > 0 && (
                        <>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>What you&apos;ll learn</p>
                          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#d4d4d8', fontSize: '14px', lineHeight: 1.6 }}>
                            {selectedEvent.topic_learn.map((item, i) => (
                              <li key={i} style={{ marginBottom: '4px' }}>{item}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {selectedEvent.description && !selectedEvent.topic_detail && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #3f3f46' }}>
                  <p style={{ color: '#d4d4d8', fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              <div style={{ marginTop: '1rem', paddingTop: '12px', borderTop: '1px solid #3f3f46', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedEvent.chapter_slug && (
                  <Link
                    href={`/chapters/${selectedEvent.chapter_slug}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '2px solid rgba(6, 182, 212, 0.5)',
                      background: 'rgba(6, 182, 212, 0.2)',
                      color: '#67e8f9',
                      fontSize: '14px',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <BookOpen className="h-4 w-4" style={{ flexShrink: 0 }} />
                    View chapter{selectedEvent.chapter_title ? `: ${selectedEvent.chapter_title}` : ''}
                  </Link>
                )}
                {selectedEvent.link && selectedEvent.link !== '#' && (
                  <a
                    href={selectedEvent.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '2px solid rgba(6, 182, 212, 0.5)',
                      background: 'rgba(6, 182, 212, 0.2)',
                      color: '#67e8f9',
                      fontSize: '14px',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <ExternalLink className="h-4 w-4" style={{ flexShrink: 0 }} />
                    Join event / Link
                  </a>
                )}
                {selectedEvent.is_registration_enabled && !selectedEvent.cohort_id && (
                  <Link
                    href={`/events/${selectedEvent.id}/register`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '2px solid rgba(249, 115, 22, 0.5)',
                      background: 'rgba(249, 115, 22, 0.2)',
                      color: '#fdba74',
                      fontSize: '14px',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Register for event
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
