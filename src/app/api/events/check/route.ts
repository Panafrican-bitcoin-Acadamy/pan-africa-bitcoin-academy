import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Check events in database - for debugging/verification
 */
export async function GET() {
  try {
    // Get all events from database
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch events', 
          hasData: false,
          count: 0,
          ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
        },
        { status: 500 }
      );
    }

    const eventCount = events?.length || 0;

    return NextResponse.json({
      hasData: eventCount > 0,
      count: eventCount,
      events: events || [],
      message: eventCount > 0 
        ? `Found ${eventCount} event(s) in database`
        : 'No events found in database. Add events to see them in the calendar.',
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error checking events:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        hasData: false,
        count: 0,
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}



