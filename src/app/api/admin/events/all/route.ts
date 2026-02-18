import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { attachRefresh, requireAdmin } from '@/lib/adminSession';

/**
 * Admin endpoint to fetch ALL events (regardless of cohort)
 * Returns all events in the system for calendar display
 */
export async function GET(_req: NextRequest) {
  try {
    const session = requireAdmin(_req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch ALL events from database (no cohort filtering for admin)
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching all events:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch events',
          ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
        },
        { status: 500 }
      );
    }

    // Transform events from database to match expected format
    const transformedEvents = (events || []).map((event: any) => {
      const startTime = event.start_time ? new Date(event.start_time) : null;
      const endTime = event.end_time ? new Date(event.end_time) : null;

      // Determine event type (default to 'community' if not set)
      type EventType = 'live-class' | 'assignment' | 'community' | 'workshop' | 'deadline' | 'quiz' | 'cohort';
      let eventType: EventType = 'community';
      if (event.type) {
        const normalizedType = event.type.toLowerCase().trim();
        const typeMap: Record<string, EventType> = {
          'live-class': 'live-class',
          'live class': 'live-class',
          'live session': 'live-class',
          'live': 'live-class',
          'assignment': 'assignment',
          'office hours': 'community',
          'community': 'community',
          'deadline': 'deadline',
          'workshop': 'workshop',
          'quiz': 'quiz',
          'cohort': 'cohort',
        };
        eventType = typeMap[normalizedType] || 'community';
      }

      // Format time string
      let timeString = '';
      if (startTime) {
        timeString = startTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
      }

      return {
        id: event.id,
        title: event.name || 'Untitled Event',
        date: startTime ? startTime.toISOString() : new Date().toISOString(),
        type: eventType,
        time: timeString,
        description: event.description || '',
        link: event.link || '#',
        recordingUrl: event.recording_url || null,
        imageUrl: event.image_url || null,
        imageAltText: event.image_alt_text || null,
        endTime: endTime ? endTime.toISOString() : null,
        cohortId: event.cohort_id || null,
        isForEveryone: !event.cohort_id,
      };
    });

    const res = NextResponse.json({ events: transformedEvents }, { status: 200 });
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('Error in admin events API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}

