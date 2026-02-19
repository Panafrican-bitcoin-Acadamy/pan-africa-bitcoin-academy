import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateAndNormalizeEmail } from '@/lib/validation';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';
import { getClientIP } from '@/lib/rate-limit';

/**
 * POST /api/admin/password-reset/request
 * Request a password reset for an admin account
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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

    // Find admin by email
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error('Database error fetching admin for password reset:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // Always return success (don't reveal if email exists)
    // But only send email if admin exists
    if (admin) {
      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token in database
      const { error: updateError } = await supabaseAdmin
        .from('admins')
        .update({
          password_reset_token: resetToken,
          password_reset_token_expiry: resetTokenExpiry.toISOString(),
        })
        .eq('id', admin.id);

      if (updateError) {
        console.error('Error storing password reset token:', updateError);
        return NextResponse.json(
          { error: 'Failed to process password reset request' },
          { status: 500 }
        );
      }

      // Create reset link
      const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://panafricanbitcoin.com';
      const resetLink = `${SITE_URL}/admin/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(normalizedEmail)}`;

      // Send password reset email
      const emailResult = await sendPasswordResetEmail({
        userName: admin.email.split('@')[0], // Use email prefix as name
        userEmail: normalizedEmail,
        resetLink,
      });

      if (!emailResult.success) {
        console.error('Failed to send password reset email:', emailResult.error);
        // Still return success to user (don't reveal email sending issues)
      }
    }

    // Always return success message (security: don't reveal if email exists)
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error: any) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}

