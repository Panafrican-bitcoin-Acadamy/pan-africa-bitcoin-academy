import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get optional cohort_id filter from query params
    const searchParams = request.nextUrl.searchParams;
    const cohortId = searchParams.get('cohort_id');

    console.log('[Events API] Fetching events', cohortId ? `for cohort: ${cohortId}` : 'for everyone');

    // Build the query - fetch all events from database
    // Filter events based on cohort_id
    // Logic:
    // - If cohort_id is NULL in database → Event is for EVERYONE (visible to all)
    // - If cohort_id is set in database → Event is for SPECIFIC COHORT only
    // - If user provides cohortId → Show: (events for everyone) OR (events for their cohort)
    // - If user doesn't provide cohortId → Show only: (events for everyone)
    
    let events: any[] = [];
    let error: any = null;

    try {
      if (cohortId) {
        // User has a cohort - show events for everyone (cohort_id IS NULL) OR events for their cohort
        // Fetch events in two queries and combine them
        const [everyoneEvents, cohortEvents] = await Promise.all([
          supabase
            .from('events')
            .select('*')
            .is('cohort_id', null)
            .order('start_time', { ascending: true }),
          supabase
            .from('events')
            .select('*')
            .eq('cohort_id', cohortId)
            .order('start_time', { ascending: true })
        ]);

        if (everyoneEvents.error) {
          console.error('[Events API] Error fetching everyone events:', everyoneEvents.error);
          error = everyoneEvents.error;
        } else if (cohortEvents.error) {
          console.error('[Events API] Error fetching cohort events:', cohortEvents.error);
          error = cohortEvents.error;
        } else {
          // Combine and deduplicate events by id
          const allEventsMap = new Map();
          (everyoneEvents.data || []).forEach((e: any) => allEventsMap.set(e.id, e));
          (cohortEvents.data || []).forEach((e: any) => allEventsMap.set(e.id, e));
          events = Array.from(allEventsMap.values());
          // Sort by start_time
          events.sort((a, b) => {
            const timeA = a.start_time ? new Date(a.start_time).getTime() : 0;
            const timeB = b.start_time ? new Date(b.start_time).getTime() : 0;
            return timeA - timeB;
          });
          console.log(`[Events API] Successfully fetched ${events.length} events (${everyoneEvents.data?.length || 0} for everyone, ${cohortEvents.data?.length || 0} for cohort)`);
        }
      } else {
        // User has no cohort - show only events for everyone (cohort_id IS NULL)
        const result = await supabase
          .from('events')
          .select('*')
          .is('cohort_id', null)
          .order('start_time', { ascending: true });
        
        if (result.error) {
          console.error('[Events API] Error fetching events:', result.error);
          error = result.error;
        } else {
          events = result.data || [];
          console.log(`[Events API] Successfully fetched ${events.length} events for everyone`);
        }
      }
    } catch (queryError: any) {
      console.error('[Events API] Query error:', queryError);
      error = queryError;
    }

    if (error) {
      console.error('[Events API] Error fetching events:', error);
      
      // Check if error is due to missing column (migration not run)
      const errorMessage = error.message || error.toString() || '';
      if (errorMessage.includes('column') && errorMessage.includes('cohort_id')) {
        console.warn('[Events API] cohort_id column may not exist. Attempting fallback query...');
        
        try {
          // Fallback: fetch all events without cohort filtering
          const { data: allEvents, error: fallbackError } = await supabase
            .from('events')
            .select('*')
            .order('start_time', { ascending: true });
          
          if (fallbackError) {
            console.error('[Events API] Fallback query also failed:', fallbackError);
            return NextResponse.json(
              { 
                error: 'Failed to fetch events', 
                details: fallbackError.message,
                hint: 'Please run the migration: supabase/add-cohort-id-to-events.sql'
              },
              { status: 500 }
            );
          }
          
          // Transform events (treat all as "for everyone" if column doesn't exist)
          const transformedEvents = (allEvents || []).map((event: any) => {
            const startTime = event.start_time ? new Date(event.start_time) : null;
            const endTime = event.end_time ? new Date(event.end_time) : null;

            type EventType = 'live-class' | 'assignment' | 'community' | 'workshop' | 'deadline' | 'quiz' | 'cohort';
            let eventType: EventType = 'community';
            if (event.type) {
              const normalizedType = event.type.toLowerCase().trim();
              const typeMap: Record<string, EventType> = {
                'live-class': 'live-class', 'live class': 'live-class', 'live session': 'live-class', 'live': 'live-class',
                'assignment': 'assignment', 'office hours': 'community', 'community': 'community', 'deadline': 'deadline',
                'workshop': 'workshop', 'quiz': 'quiz', 'cohort': 'cohort',
              };
              eventType = typeMap[normalizedType] || 'community';
            }

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
              endTime: endTime ? endTime.toISOString() : null,
              cohortId: null, // Column doesn't exist, treat as for everyone
              isForEveryone: true,
            };
          });

          console.log(`[Events API] Fallback successful: fetched ${transformedEvents.length} events`);
          return NextResponse.json({ events: transformedEvents }, { status: 200 });
        } catch (fallbackErr: any) {
          console.error('[Events API] Fallback error:', fallbackErr);
          return NextResponse.json(
            { 
              error: 'Failed to fetch events',
              details: fallbackErr.message || errorMessage,
              ...(process.env.NODE_ENV === 'development' ? { stack: fallbackErr.stack } : {})
            },
            { status: 500 }
          );
        }
      }
      
      // Return error with details
      return NextResponse.json(
        { 
          error: 'Failed to fetch events',
          message: errorMessage,
          ...(process.env.NODE_ENV === 'development' ? { 
            details: error.message || error.toString(),
            code: error.code,
            hint: error.hint
          } : {})
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
        endTime: endTime ? endTime.toISOString() : null,
        cohortId: event.cohort_id || null,
        isForEveryone: !event.cohort_id, // true if event is for everyone
      };
    });

    console.log(`[Events API] Returning ${transformedEvents.length} transformed events`);
    return NextResponse.json({ events: transformedEvents }, { status: 200 });
  } catch (error: any) {
    console.error('[Events API] Unexpected error:', error);
    console.error('[Events API] Error stack:', error.stack);
    
    // Check if it's a database connection error
    if (error.message?.includes('connect') || error.message?.includes('ECONNREFUSED') || error.message?.includes('timeout')) {
      return NextResponse.json(
        { 
          error: 'Database connection error',
          message: 'Unable to connect to the database. Please try again later.',
          ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
        },
        { status: 503 }
      );
    }
    
    // Check if it's a table/column missing error
    if (error.message?.includes('relation') || error.message?.includes('does not exist') || error.message?.includes('column')) {
      return NextResponse.json(
        { 
          error: 'Database schema error',
          message: 'The events table or required columns may not exist. Please check your database migrations.',
          ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching events.',
        ...(process.env.NODE_ENV === 'development' ? { 
          details: error.message,
          stack: error.stack 
        } : {})
      },
      { status: 500 }
    );
  }
}


