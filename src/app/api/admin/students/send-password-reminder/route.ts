import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateAndNormalizeEmail } from '@/lib/validation';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

/**
 * POST /api/admin/students/send-password-reminder
 *
 * Admin endpoint to send a one-time password setup/reset link to a student.
 * Intended as a second reminder for students who have not yet set their password.
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

    const emailValidation = validateAndNormalizeEmail(email);
    if (!emailValidation.valid || !emailValidation.normalized) {
      return NextResponse.json(
        { error: emailValidation.error || 'Invalid email format' },
        { status: 400 }
      );
    }

    const normalizedEmail = emailValidation.normalized;

    // Look up student profile by email
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, password_hash')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching profile for password reminder:', error);
      return NextResponse.json(
        { error: 'Database error while fetching student profile' },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          emailFound: false,
          message: 'No student account found with this email address.',
        },
        { status: 200 }
      );
    }

    // If the student already has a password, no need to send a setup link again
    if (profile.password_hash) {
      return NextResponse.json(
        {
          success: false,
          alreadyHasPassword: true,
          message:
            'This student has already set a password. Ask them to use "Forgot Password" if they need a new link.',
        },
        { status: 200 }
      );
    }

    // Generate secure reset token (one-time use)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour expiry

    // Store token on the profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry.toISOString(),
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('❌ Error storing reset token for student:', updateError);
      return NextResponse.json(
        { error: 'Failed to generate password setup link' },
        { status: 500 }
      );
    }

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://panafricanbitcoin.com';
    const resetLink = `${SITE_URL}/reset-password?token=${encodeURIComponent(
      resetToken
    )}&email=${encodeURIComponent(normalizedEmail)}`;

    // Send reminder email with explicit "second time" wording
    const emailResult = await sendPasswordResetEmail({
      userName: profile.name || 'Student',
      userEmail: profile.email,
      resetLink,
      isReminder: true,
    });

    if (!emailResult.success) {
      console.error('❌ Failed to send student password reminder email:', {
        error: emailResult.error,
        errorDetails: emailResult.errorDetails,
        email: profile.email,
      });
      return NextResponse.json(
        { error: 'Failed to send password setup link email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          'Password setup link sent. Let the student know this is their second chance to set a secure password.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error in send-password-reminder API:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      { error: 'Failed to send password setup link' },
      { status: 500 }
    );
  }
}

