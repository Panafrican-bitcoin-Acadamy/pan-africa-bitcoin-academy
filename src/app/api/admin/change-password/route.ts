import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';
import { validatePassword } from '@/lib/validation';
import bcrypt from 'bcryptjs';

/**
 * POST /api/admin/change-password
 * Change admin password (requires authentication)
 * Used when admin has temporary password and needs to set a permanent one
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

    const { currentPassword, newPassword, confirmPassword } = await req.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Current password, new password, and confirmation are required' },
        { status: 400 }
      );
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error || 'Invalid password' },
        { status: 400 }
      );
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirmation do not match' },
        { status: 400 }
      );
    }

    // Get admin details
    const { data: admin, error: fetchError } = await supabaseAdmin
      .from('admins')
      .select('id, email, password_hash')
      .eq('id', session.adminId)
      .maybeSingle();

    if (fetchError || !admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    if (!admin.password_hash) {
      return NextResponse.json(
        { error: 'Admin account not properly configured' },
        { status: 500 }
      );
    }

    // Verify current password
    const currentPasswordValid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!currentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, admin.password_hash);
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear password change requirement
    const updateData: any = {
      password_hash: newPasswordHash,
      password_changed_at: new Date().toISOString(),
      force_password_change: false,
    };

    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update(updateData)
      .eq('id', admin.id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been changed successfully. You can now access the admin panel.',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}

