import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/account-management/locked-accounts
 * Get all locked admin accounts
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

    const now = new Date().toISOString();

    // Get all locked accounts (locked_until > now)
    const { data: lockedAccounts, error } = await supabaseAdmin
      .from('admins')
      .select('id, email, role, failed_login_attempts, locked_until, last_failed_login')
      .not('locked_until', 'is', null)
      .gt('locked_until', now)
      .order('locked_until', { ascending: true });

    if (error) {
      console.error('Error fetching locked accounts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch locked accounts' },
        { status: 500 }
      );
    }

    // Format accounts for response
    const formattedAccounts = (lockedAccounts || []).map((account) => ({
      id: account.id,
      email: account.email,
      role: account.role,
      failedLoginAttempts: account.failed_login_attempts || 0,
      lockedUntil: account.locked_until,
      lastFailedLogin: account.last_failed_login,
      minutesRemaining: Math.ceil(
        (new Date(account.locked_until!).getTime() - Date.now()) / (60 * 1000)
      ),
    }));

    return NextResponse.json({
      success: true,
      accounts: formattedAccounts,
      total: formattedAccounts.length,
    });
  } catch (error: any) {
    console.error('Get locked accounts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locked accounts' },
      { status: 500 }
    );
  }
}

