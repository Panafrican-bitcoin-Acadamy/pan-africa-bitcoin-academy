import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { attachRefresh, requireAdmin } from '@/lib/adminSession';

// Get all live-class events (for CSV upload selection)
export async function GET(_req: NextRequest) {
  try {
    const session = requireAdmin(_req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('id, name, start_time, chapter_number, cohort_id')
      .eq('type', 'live-class')
      .order('start_time', { ascending: false });

    if (error) {
      throw error;
    }

    const res = NextResponse.json({ events: events || [] }, { status: 200 });
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('Error fetching live-class events:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}


