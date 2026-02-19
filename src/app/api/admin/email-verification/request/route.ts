import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendVerificationEmail } from '@/lib/email';
import { validateAndNormalizeEmail } from '@/lib/validation';
import crypto from 'crypto';

/**
 * POST /api/admin/email-verification/request
 * Request email verification email (no authentication required)
 * Used when admin can't log in due to unverified email
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
      .select('id, email, email_verified')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error('Database error fetching admin for verification:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // Always return success (don't reveal if email exists)
    // But only send email if admin exists
    if (admin) {
      // Check if already verified
      if (admin.email_verified) {
        return NextResponse.json({
          success: true,
          message: 'Email is already verified. You can log in now.',
          alreadyVerified: true,
        });
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store verification token
      const { error: updateError } = await supabaseAdmin
        .from('admins')
        .update({
          email_verification_token: verificationToken,
          email_verification_token_expiry: tokenExpiry.toISOString(),
        })
        .eq('id', admin.id);

      if (updateError) {
        console.error('Error storing verification token:', updateError);
        return NextResponse.json(
          { error: 'Failed to generate verification token' },
          { status: 500 }
        );
      }

      // Send verification email
      const emailResult = await sendVerificationEmail({
        userName: admin.email.split('@')[0],
        userEmail: admin.email,
        verificationToken,
      });

      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);
        // Still return success to user (don't reveal email sending issues)
        return NextResponse.json({
          success: true,
          message: 'If an account with that email exists and needs verification, a verification email has been sent.',
          emailSent: false,
          emailError: emailResult.error,
        });
      }
    }

    // Always return success message (security: don't reveal if email exists)
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists and needs verification, a verification email has been sent. Please check your inbox.',
    });
  } catch (error: any) {
    console.error('Request verification email error:', error);
    return NextResponse.json(
      { error: 'Failed to process verification request' },
      { status: 500 }
    );
  }
}

