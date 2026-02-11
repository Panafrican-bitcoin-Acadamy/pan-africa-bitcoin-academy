import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/students
 * Get all students (profiles) for admin dropdowns
 * SECURITY: This endpoint requires admin authentication and only returns minimal student data
 * 
 * Query params:
 * - from_sats: If true, only return students who have received sats (pending or paid status)
 * - cohort_id: Filter by cohort ID
 * - status: Filter by student status
 * - limit: Number of results to return (default: 1000, max: 5000)
 * - offset: Pagination offset (default: 0)
 * - search: Search by name or email (case-insensitive)
 */
export async function GET(request: NextRequest) {
  try {
    // Strict admin authentication check
    const session = requireAdmin(request);
    if (!session) {
      console.warn('[Admin Students API] Unauthorized access attempt from:', request.headers.get('x-forwarded-for') || 'unknown');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const fromSats = searchParams.get('from_sats') === 'true';
    const cohortId = searchParams.get('cohort_id');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '1000', 10), 5000);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let students: any[] = [];
    let totalCount = 0;

    if (fromSats) {
      // Optimized: First get unique student IDs with a single query using distinct
      // Then fetch profiles in one query instead of two separate queries
      let satsQuery = supabaseAdmin
        .from('sats_rewards')
        .select('student_id', { count: 'exact' })
        .in('status', ['pending', 'paid'])
        .not('student_id', 'is', null);

      const { data: satsRewards, error: satsError, count: satsCount } = await satsQuery;

      if (satsError) {
        console.error('[Admin Students API] Error fetching sats rewards:', satsError);
        return NextResponse.json(
          {
            error: 'Failed to fetch students from sats database',
            ...(process.env.NODE_ENV === 'development' ? { details: satsError.message } : {}),
          },
          { status: 500 }
        );
      }

      // Get unique student IDs
      const studentIds = [...new Set((satsRewards || []).map((r: any) => r.student_id).filter(Boolean))];

      if (studentIds.length === 0) {
        return NextResponse.json(
          {
            students: [],
            pagination: { total: 0, limit, offset, hasMore: false },
          },
          { status: 200 }
        );
      }

      // Now fetch profiles for these students with filters applied
      let profilesQuery = supabaseAdmin
        .from('profiles')
        .select('id, name, email, status, cohort_id', { count: 'exact' })
        .in('id', studentIds);

      // Apply filters
      if (cohortId) {
        profilesQuery = profilesQuery.eq('cohort_id', cohortId);
      }
      if (status) {
        profilesQuery = profilesQuery.eq('status', status);
      }
      if (search) {
        profilesQuery = profilesQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data: profiles, error: profilesError, count } = await profilesQuery
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (profilesError) {
        console.error('[Admin Students API] Error fetching profiles:', profilesError);
        return NextResponse.json(
          {
            error: 'Failed to fetch student profiles',
            ...(process.env.NODE_ENV === 'development' ? { details: profilesError.message } : {}),
          },
          { status: 500 }
        );
      }

      // Transform to match expected format
      students = (profiles || []).map((profile: any) => ({
        id: profile.id,
        name: profile.name || profile.email || 'Unknown',
        email: profile.email || '',
        status: profile.status || 'New',
        cohort_id: profile.cohort_id || null,
      }));
      totalCount = count || students.length;
    } else {
      // Fetch all profiles with optional filters
      let query = supabaseAdmin
        .from('profiles')
        .select('id, name, email, status, cohort_id', { count: 'exact' });

      // Apply filters
      if (cohortId) {
        query = query.eq('cohort_id', cohortId);
      }
      if (status) {
        query = query.eq('status', status);
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data: profiles, error, count } = await query
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('[Admin Students API] Error fetching profiles:', error);
        return NextResponse.json(
          {
            error: 'Failed to fetch students',
            ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
          },
          { status: 500 }
        );
      }

      // Transform to match expected format - only return minimal necessary data
      students = (profiles || []).map((profile: any) => ({
        id: profile.id,
        name: profile.name || profile.email || 'Unknown',
        email: profile.email || '',
        status: profile.status || 'New',
        cohort_id: profile.cohort_id || null,
      }));
      totalCount = count || students.length;
    }

    // Security: Log data access for auditing (only in development or for large queries)
    if (process.env.NODE_ENV === 'development' || students.length > 100) {
      console.log(`[Admin Students API] Returning ${students.length} students (total: ${totalCount})${fromSats ? ' (from sats database)' : ''} to admin: ${session.email}`);
    }
    
    // Return response with security headers and pagination info
    const response = NextResponse.json(
      {
        students,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + students.length < totalCount,
        },
      },
      { status: 200 }
    );
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    return response;
  } catch (error: any) {
    console.error('[Admin Students API] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}

