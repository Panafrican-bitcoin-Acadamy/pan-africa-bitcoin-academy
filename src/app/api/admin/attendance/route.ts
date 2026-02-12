import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/attendance
 * Get all attendance records with student and event details
 */
export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get optional filters from query params
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('event_id');
    const studentId = searchParams.get('student_id');
    const limit = parseInt(searchParams.get('limit') || '1000');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabaseAdmin
      .from('attendance')
      .select(`
        *,
        events (
          id,
          name,
          type,
          start_time,
          end_time,
          chapter_number,
          cohort_id
        ),
        profiles:student_id (
          id,
          name,
          email,
          phone,
          country,
          cohort_id
        )
      `)
      .order('join_time', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (eventId) {
      query = query.eq('event_id', eventId);
    }
    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data: attendanceRecords, error: attendanceError } = await query;

    if (attendanceError) {
      console.error('[Admin Attendance API] Error fetching attendance:', attendanceError);
      return NextResponse.json(
        {
          error: 'Failed to fetch attendance records',
          ...(process.env.NODE_ENV === 'development' ? { details: attendanceError.message } : {}),
        },
        { status: 500 }
      );
    }

    // Get total count (for pagination)
    let countQuery = supabaseAdmin
      .from('attendance')
      .select('*', { count: 'exact', head: true });

    if (eventId) {
      countQuery = countQuery.eq('event_id', eventId);
    }
    if (studentId) {
      countQuery = countQuery.eq('student_id', studentId);
    }

    const { count, error: countError } = await countQuery;

    // Transform and format the data
    const formattedRecords = (attendanceRecords || []).map((record: any) => {
      const event = Array.isArray(record.events) ? record.events[0] : record.events;
      const profile = Array.isArray(record.profiles) ? record.profiles[0] : record.profiles;

      return {
        id: record.id,
        studentId: record.student_id,
        eventId: record.event_id,
        studentName: profile?.name || record.name || 'Unknown',
        studentEmail: profile?.email || record.email || 'Unknown',
        studentPhone: profile?.phone || null,
        studentCountry: profile?.country || null,
        eventName: event?.name || 'Unknown Event',
        eventType: event?.type || 'live-class',
        eventStartTime: event?.start_time || null,
        eventEndTime: event?.end_time || null,
        joinTime: record.join_time || null,
        leaveTime: record.leave_time || null,
        durationMinutes: record.duration_minutes || null,
        createdAt: record.created_at || null,
      };
    });

    return NextResponse.json(
      {
        records: formattedRecords,
        total: count || formattedRecords.length,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Admin Attendance API] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}


