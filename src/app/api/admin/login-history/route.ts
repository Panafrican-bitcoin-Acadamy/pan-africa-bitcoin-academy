import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/login-history
 * Get login history for all admins (admin only)
 * Supports filtering by email, IP, success status, and date range
 */
export async function GET(req: NextRequest) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const ipAddress = searchParams.get('ip');
    const success = searchParams.get('success');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabaseAdmin
      .from('admin_login_attempts')
      .select('id, admin_id, email, ip_address, user_agent, request_id, success, failure_reason, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (email) {
      query = query.ilike('email', `%${email}%`);
    }
    if (ipAddress) {
      query = query.eq('ip_address', ipAddress);
    }
    if (success !== null && success !== '') {
      query = query.eq('success', success === 'true');
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: attempts, error, count } = await query;

    if (error) {
      console.error('Error fetching login history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch login history' },
        { status: 500 }
      );
    }

    // Format attempts for response
    const formattedAttempts = (attempts || []).map((attempt) => ({
      id: attempt.id,
      adminId: attempt.admin_id,
      email: attempt.email,
      ipAddress: attempt.ip_address,
      userAgent: attempt.user_agent,
      requestId: attempt.request_id,
      success: attempt.success,
      failureReason: attempt.failure_reason,
      createdAt: attempt.created_at,
      device: attempt.user_agent ? extractDeviceInfo(attempt.user_agent) : 'Unknown',
    }));

    return NextResponse.json({
      success: true,
      attempts: formattedAttempts,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Get login history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch login history' },
      { status: 500 }
    );
  }
}

/**
 * Extract device info from user agent string
 */
function extractDeviceInfo(userAgent: string): string {
  if (!userAgent) return 'Unknown';

  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';

  return `${browser} on ${os}`;
}

