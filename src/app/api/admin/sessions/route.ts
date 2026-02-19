import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';
import { signSession } from '@/lib/session';
import crypto from 'crypto';

/**
 * GET /api/admin/sessions
 * Get all active sessions for the current admin
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

    // Get all active sessions for this admin
    const { data: sessions, error } = await supabaseAdmin
      .from('admin_active_sessions')
      .select('id, ip_address, user_agent, issued_at, last_active, expires_at, revoked, revoked_at')
      .eq('admin_id', session.adminId)
      .eq('revoked', false)
      .gt('expires_at', new Date().toISOString())
      .order('last_active', { ascending: false });

    if (error) {
      console.error('Error fetching active sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    // Get current session token to identify which one is current
    const currentSessionToken = req.cookies.get('admin_session')?.value;
    let currentSessionId: string | null = null;

    if (currentSessionToken) {
      // Hash the current token to match against stored hashes
      const hashedToken = crypto
        .createHash('sha256')
        .update(currentSessionToken)
        .digest('hex');

      const { data: currentSession } = await supabaseAdmin
        .from('admin_active_sessions')
        .select('id')
        .eq('admin_id', session.adminId)
        .eq('session_token', hashedToken)
        .maybeSingle();

      if (currentSession) {
        currentSessionId = currentSession.id;
      }
    }

    // Format sessions for response
    const formattedSessions = (sessions || []).map((s) => ({
      id: s.id,
      ipAddress: s.ip_address,
      userAgent: s.user_agent,
      issuedAt: s.issued_at,
      lastActive: s.last_active,
      expiresAt: s.expires_at,
      isCurrent: s.id === currentSessionId,
      device: s.user_agent ? extractDeviceInfo(s.user_agent) : 'Unknown',
    }));

    return NextResponse.json({
      success: true,
      sessions: formattedSessions,
      total: formattedSessions.length,
    });
  } catch (error: any) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/sessions
 * Revoke a specific session or all sessions
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId, revokeAll } = await req.json().catch(() => ({}));

    if (revokeAll) {
      // Revoke all sessions except current
      const currentSessionToken = req.cookies.get('admin_session')?.value;
      let currentSessionHash: string | null = null;

      if (currentSessionToken) {
        currentSessionHash = crypto
          .createHash('sha256')
          .update(currentSessionToken)
          .digest('hex');
      }

      const { error } = await supabaseAdmin
        .from('admin_active_sessions')
        .update({
          revoked: true,
          revoked_at: new Date().toISOString(),
        })
        .eq('admin_id', session.adminId)
        .neq('session_token', currentSessionHash || '');

      if (error) {
        console.error('Error revoking all sessions:', error);
        return NextResponse.json(
          { error: 'Failed to revoke sessions' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'All other sessions have been revoked',
      });
    } else if (sessionId) {
      // Revoke specific session
      const { error } = await supabaseAdmin
        .from('admin_active_sessions')
        .update({
          revoked: true,
          revoked_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .eq('admin_id', session.adminId); // Ensure admin can only revoke their own sessions

      if (error) {
        console.error('Error revoking session:', error);
        return NextResponse.json(
          { error: 'Failed to revoke session' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Session has been revoked',
      });
    } else {
      return NextResponse.json(
        { error: 'sessionId or revokeAll is required' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Revoke session error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke session' },
      { status: 500 }
    );
  }
}

/**
 * Extract device info from user agent string
 */
function extractDeviceInfo(userAgent: string): string {
  if (!userAgent) return 'Unknown';

  // Extract browser
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  // Extract OS
  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';

  return `${browser} on ${os}`;
}

