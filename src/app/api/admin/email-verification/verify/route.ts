import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateAndNormalizeEmail } from '@/lib/validation';

/**
 * POST /api/admin/email-verification/verify
 * Verify email using token
 */
export async function POST(req: NextRequest) {
  try {
    const { token, email } = await req.json();

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token and email are required' },
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

    // Find admin with matching token and email
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('id, email, email_verified, email_verification_token, email_verification_token_expiry')
      .eq('email', normalizedEmail)
      .eq('email_verification_token', token)
      .maybeSingle();

    if (error) {
      console.error('Database error fetching admin for email verification:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (admin.email_verified) {
      return NextResponse.json({
        success: true,
        message: 'Email is already verified',
        alreadyVerified: true,
      });
    }

    // Check if token is expired
    if (!admin.email_verification_token_expiry) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    const expiryDate = new Date(admin.email_verification_token_expiry);
    if (expiryDate < new Date()) {
      // Clear expired token
      await supabaseAdmin
        .from('admins')
        .update({
          email_verification_token: null,
          email_verification_token_expiry: null,
        })
        .eq('id', admin.id);

      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify email
    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update({
        email_verified: true,
        email_verification_token: null,
        email_verification_token_expiry: null,
      })
      .eq('id', admin.id);

    if (updateError) {
      console.error('Error verifying email:', updateError);
      return NextResponse.json(
        { error: 'Failed to verify email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email has been verified successfully. You can now log in.',
    });
  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}

