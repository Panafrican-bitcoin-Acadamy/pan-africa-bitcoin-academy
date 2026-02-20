import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

type RouteParams = {
  params: Promise<{ eventId: string }>;
};

/**
 * GET /api/events/[eventId]/registrations
 * Admin-only endpoint to get all registrations for an event
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Require admin authentication
    const admin = requireAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { eventId } = await params;

    // Validate eventId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID format' },
        { status: 400 }
      );
    }

    // Verify event exists
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, name')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Fetch registrations
    const { data: registrations, error } = await supabaseAdmin
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Registrations API] Error fetching registrations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch registrations', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        event: {
          id: event.id,
          name: event.name,
        },
        registrations: registrations || [],
        count: registrations?.length || 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Registrations API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

