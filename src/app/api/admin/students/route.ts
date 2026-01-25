import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/students
 * Get all students (profiles) for admin dropdowns
 * SECURITY: This endpoint requires admin authentication and only returns minimal student data
 * Query params:
 * - from_sats: If true, only return students who have received sats (pending or paid status)
 */
export async function GET(request: NextRequest) {
  try {
    // Strict admin authentication check
    const session = requireAdmin(request);
    if (!session) {
      console.warn('[Admin Students API] Unauthorized access attempt from:', request.headers.get('x-forwarded-for') || 'unknown');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Log access for security auditing
    console.log(`[Admin Students API] Authorized access by admin: ${session.email} (${session.adminId})`);

    const searchParams = request.nextUrl.searchParams;
    const fromSats = searchParams.get('from_sats') === 'true';

    let students: any[] = [];

    if (fromSats) {
      // Only fetch students who have sats rewards with status 'pending' or 'paid'
      const { data: satsRewards, error: satsError } = await supabaseAdmin
        .from('sats_rewards')
        .select('student_id')
        .in('status', ['pending', 'paid'])
        .not('student_id', 'is', null);

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
        console.log('[Admin Students API] No students with sats rewards found');
        return NextResponse.json({ students: [] }, { status: 200 });
      }

      // Fetch profiles for these students
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, name, email, status')
        .in('id', studentIds)
        .order('name', { ascending: true });

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

      // Transform to match expected format - only return minimal necessary data
      students = (profiles || []).map((profile: any) => ({
        id: profile.id, // This is the profile ID used in sats_rewards.student_id
        name: profile.name || profile.email || 'Unknown',
        email: profile.email || '',
        status: profile.status || 'New',
        // Explicitly exclude sensitive data like phone, address, etc.
      }));
    } else {
      // Fetch all profiles (original behavior) - but only for authenticated admins
      const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('id, name, email, status') // Only select necessary fields
        .order('name', { ascending: true })
        .limit(1000); // Limit to prevent huge responses and potential DoS

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
        id: profile.id, // This is the profile ID used in sats_rewards.student_id
        name: profile.name || profile.email || 'Unknown',
        email: profile.email || '',
        status: profile.status || 'New',
        // Explicitly exclude sensitive data like phone, address, etc.
      }));
    }

    // Security: Log data access for auditing
    console.log(`[Admin Students API] Returning ${students.length} students${fromSats ? ' (from sats database)' : ''} to admin: ${session.email}`);
    
    // Return response with security headers
    const response = NextResponse.json({ students }, { status: 200 });
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

