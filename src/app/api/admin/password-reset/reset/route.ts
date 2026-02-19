import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateAndNormalizeEmail, validatePassword } from '@/lib/validation';
import bcrypt from 'bcryptjs';

/**
 * POST /api/admin/password-reset/reset
 * Reset password using token
 */
export async function POST(req: NextRequest) {
  try {
    const { token, email, newPassword } = await req.json();

    if (!token || !email || !newPassword) {
      return NextResponse.json(
        { error: 'Token, email, and new password are required' },
        { status: 400 }
      );
    }

    // Validate and normalize email
    const emailValidation = validateAndNormalizeEmail(email);
    if (!emailValidation.valid || !emailValidation.normalized) {
      return NextResponse.json(
        { error: emailValidation.error || 'Invalid email format' },
        { status: 400 }
      );
    }
    const normalizedEmail = emailValidation.normalized;

    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error || 'Invalid password' },
        { status: 400 }
      );
    }

    // Find admin with matching token and email
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('id, email, password_reset_token, password_reset_token_expiry')
      .eq('email', normalizedEmail)
      .eq('password_reset_token', token)
      .maybeSingle();

    if (error) {
      console.error('Database error fetching admin for password reset:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (!admin.password_reset_token_expiry) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const expiryDate = new Date(admin.password_reset_token_expiry);
    if (expiryDate < new Date()) {
      // Clear expired token
      await supabaseAdmin
        .from('admins')
        .update({
          password_reset_token: null,
          password_reset_token_expiry: null,
        })
        .eq('id', admin.id);

      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update({
        password_hash: passwordHash,
        password_reset_token: null,
        password_reset_token_expiry: null,
        failed_login_attempts: 0, // Reset failed attempts
        locked_until: null, // Unlock account if locked
      })
      .eq('id', admin.id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error: any) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

