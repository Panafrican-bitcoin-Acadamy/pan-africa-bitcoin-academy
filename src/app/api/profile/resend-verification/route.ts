import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateAndNormalizeEmail } from '@/lib/validation';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

/**
 * Resend Verification Email Endpoint
 * Generates a new verification token and sends verification email
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
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    const emailLower = emailValidation.normalized;

    // Find profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, email_verified_at')
      .eq('email', emailLower)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile for resend verification:', profileError);
      return NextResponse.json(
        { error: 'Failed to process request' },
        { status: 500 }
      );
    }

    if (!profile) {
      // Don't reveal if email exists (security best practice)
      return NextResponse.json(
        { 
          success: true, 
          message: 'If an account exists with this email, a verification email has been sent.' 
        },
        { status: 200 }
      );
    }

    // Check if already verified
    if (profile.email_verified_at) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Email is already verified',
          alreadyVerified: true 
        },
        { status: 200 }
      );
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Expires in 24 hours

    // Update profile with new token
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        email_verification_token: verificationToken,
        email_verification_token_expiry: tokenExpiry.toISOString(),
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error updating verification token:', updateError);
      return NextResponse.json(
        { error: 'Failed to generate verification token' },
        { status: 500 }
      );
    }

    // Send verification email
    const emailResult = await sendVerificationEmail({
      userName: profile.name || 'User',
      userEmail: emailLower,
      verificationToken,
    });

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      return NextResponse.json(
        { error: emailResult.error || 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Verification email sent successfully' 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in resend-verification API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

