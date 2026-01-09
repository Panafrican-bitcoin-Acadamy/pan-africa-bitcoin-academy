import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateAndNormalizeEmail } from '@/lib/validation';
import crypto from 'crypto';

/**
 * Email Verification Endpoint
 * Verifies the email verification token and marks email as verified
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

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
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    const emailLower = emailValidation.normalized;

    // Find profile with matching token and email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, email_verification_token, email_verification_token_expiry, email_verified_at')
      .eq('email', emailLower)
      .eq('email_verification_token', token)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile for verification:', profileError);
      return NextResponse.json(
        { error: 'Failed to verify email' },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (profile.email_verified_at) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Email already verified',
          alreadyVerified: true 
        },
        { status: 200 }
      );
    }

    // Check if token has expired
    if (profile.email_verification_token_expiry) {
      const expiryDate = new Date(profile.email_verification_token_expiry);
      const now = new Date();
      if (now > expiryDate) {
        return NextResponse.json(
          { error: 'Verification token has expired. Please request a new verification email.' },
          { status: 400 }
        );
      }
    }

    // Verify email - mark as verified and clear token
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        email_verified_at: new Date().toISOString(),
        email_verification_token: null,
        email_verification_token_expiry: null,
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error updating profile verification status:', updateError);
      return NextResponse.json(
        { error: 'Failed to verify email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Email verified successfully' 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in verify-email API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

