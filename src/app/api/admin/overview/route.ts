import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { attachRefresh, requireAdmin } from '@/lib/adminSession';

export async function GET(_req: NextRequest) {
  try {
    const session = requireAdmin(_req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Application counts
    const [{ count: totalApplications }, { count: pendingApplications }, { count: approvedApplications }, { count: rejectedApplications }] =
      await Promise.all([
        supabaseAdmin.from('applications').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabaseAdmin.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'Approved'),
        supabaseAdmin.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'Rejected'),
      ]);

    // Students, cohorts, events
    const [{ count: totalStudents }, { count: totalCohorts }, { data: upcomingEvents, error: eventsError }] = await Promise.all([
      supabaseAdmin.from('students').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('cohorts').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('events')
        .select('id, name, start_time, end_time, type, cohort_id')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5),
    ]);

    if (eventsError) {
      throw eventsError;
    }

    // Recent applications (latest 5)
    const { data: recentApplications, error: recentError } = await supabaseAdmin
      .from('applications')
      .select('id, first_name, last_name, email, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      throw recentError;
    }

    const res = NextResponse.json(
      {
        summary: {
          totalApplications: totalApplications || 0,
          pendingApplications: pendingApplications || 0,
          approvedApplications: approvedApplications || 0,
          rejectedApplications: rejectedApplications || 0,
          totalStudents: totalStudents || 0,
          totalCohorts: totalCohorts || 0,
          upcomingEventsCount: upcomingEvents?.length || 0,
        },
        upcomingEvents: upcomingEvents || [],
        recentApplications: recentApplications || [],
      },
      { status: 200 },
    );
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('Error in admin overview API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 },
    );
  }
}

