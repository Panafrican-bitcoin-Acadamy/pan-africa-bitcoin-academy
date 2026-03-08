import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/events/registrations
 * Admin-only: list all event registrations with event name
 */
export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { data: registrations, error } = await supabaseAdmin
      .from('event_registrations')
      .select(`
        id,
        event_id,
        full_name,
        email,
        phone,
        additional_data,
        created_at,
        events (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin Event Registrations] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch registrations', details: error.message },
        { status: 500 }
      );
    }

    const list = (registrations || []).map((r: any) => {
      const event = Array.isArray(r.events) ? r.events[0] : r.events;
      return {
        id: r.id,
        event_id: r.event_id,
        event_name: event?.name ?? 'Unknown Event',
        full_name: r.full_name,
        email: r.email,
        phone: r.phone ?? null,
        additional_data: r.additional_data ?? null,
        created_at: r.created_at,
      };
    });

    return NextResponse.json(
      { registrations: list, count: list.length },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[Admin Event Registrations] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}
