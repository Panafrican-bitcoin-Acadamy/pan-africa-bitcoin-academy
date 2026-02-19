import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * POST /api/admin/account-management/unlock
 * Unlock a locked admin account
 */
export async function POST(req: NextRequest) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { adminId } = await req.json();

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    // Verify admin exists
    const { data: admin, error: fetchError } = await supabaseAdmin
      .from('admins')
      .select('id, email, locked_until')
      .eq('id', adminId)
      .maybeSingle();

    if (fetchError || !admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Unlock account
    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update({
        locked_until: null,
        failed_login_attempts: 0,
        last_failed_login: null,
      })
      .eq('id', adminId);

    if (updateError) {
      console.error('Error unlocking account:', updateError);
      return NextResponse.json(
        { error: 'Failed to unlock account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Account for ${admin.email} has been unlocked`,
    });
  } catch (error: any) {
    console.error('Unlock account error:', error);
    return NextResponse.json(
      { error: 'Failed to unlock account' },
      { status: 500 }
    );
  }
}

