import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/developer-events
 * Get all developer events
 */
export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: events, error } = await supabaseAdmin
      .from('developer_events')
      .select('*')
      .order('start_time', { ascending: false });

    if (error) {
      console.error('[Admin Developer Events API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch developer events', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ events: events || [] }, { status: 200 });
  } catch (error: any) {
    console.error('[Admin Developer Events API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/developer-events
 * Create a new developer event
 */
export async function POST(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, start_time, end_time, location, link, description } = body;

    if (!name || !start_time) {
      return NextResponse.json({ error: 'Name and start_time are required' }, { status: 400 });
    }

    const { data: event, error } = await supabaseAdmin
      .from('developer_events')
      .insert({
        name,
        type,
        start_time,
        end_time,
        location,
        link,
        description,
      })
      .select()
      .single();

    if (error) {
      console.error('[Admin Developer Events API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to create event', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error: any) {
    console.error('[Admin Developer Events API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

