import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { sendPasswordResetEmail } from '@/lib/email';
import { secureEmailInput, validateRequestBody, addSecurityHeaders } from '@/lib/security-utils';
import crypto from 'crypto';

/**
 * Password Reset Flow:
 * 1. User requests password reset with email
 * 2. Generate secure reset token
 * 3. Store token in database with expiration
 * 4. Send email with reset link (in production, integrate with email service)
 * 5. User clicks link, enters new password
 * 6. Verify token and update password
 */

// In production, use a proper email service (SendGrid, Resend, etc.)
// For now, we'll generate the token and return it (you'll need to send email manually or integrate email service)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body structure and size
    const bodyValidation = validateRequestBody(body, 10000);
    if (!bodyValidation.valid) {
      const response = NextResponse.json(
        { error: bodyValidation.error || 'Invalid request' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    const { email } = body;

    // Validate and sanitize email
    const emailValidation = secureEmailInput(email);
    if (!emailValidation.valid || !emailValidation.normalized) {
      // Always return success for security (prevent email enumeration)
      const response = NextResponse.json(
        { 
          success: true, 
          message: 'If an account exists with this email, you will receive password reset instructions.' 
        },
        { status: 200 }
      );
      return addSecurityHeaders(response);
    }

    // Check if profile exists (use normalized email)
    // Use supabaseAdmin for reliable querying
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name')
      .eq('email', emailValidation.normalized)
      .maybeSingle();

    // Check if email exists in database
    if (profileError) {
      console.error('❌ Error checking profile:', {
        error: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code,
      });
      const response = NextResponse.json(
        { 
          success: false,
          error: 'An error occurred. Please try again later.' 
        },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }

    if (!profile) {
      // Email not found - return response indicating account doesn't exist
      const response = NextResponse.json(
        { 
          success: false,
          emailFound: false,
          message: 'No account found with this email address.' 
        },
        { status: 200 }
      );
      return addSecurityHeaders(response);
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token expires in 1 hour

    // Store reset token in database
    // Use supabaseAdmin for reliable updates
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry.toISOString(),
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('❌ Error storing reset token:', {
        error: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
        profileId: profile.id,
      });
      // Still return success for security - don't reveal database errors
      const response = NextResponse.json(
        { 
          success: true, 
          message: 'If an account exists with this email, you will receive password reset instructions.' 
        },
        { status: 200 }
      );
      return addSecurityHeaders(response);
    }

    // Create reset link (use normalized email for encoding)
    const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(emailValidation.normalized)}`;
    
    // Send password reset email
    const emailResult = await sendPasswordResetEmail({
      userName: profile.name || 'User',
      userEmail: profile.email,
      resetLink,
    });
    
    if (!emailResult.success) {
      console.error('❌ Failed to send password reset email:', {
        error: emailResult.error,
        errorDetails: emailResult.errorDetails,
        email: profile.email,
      });
      // Still return success for security - don't reveal email sending failure
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Password reset link (DEV ONLY - copy this to test):', resetLink);
      }
    } else {
      console.log('✅ Password reset email sent successfully to:', profile.email);
    }

    const response = NextResponse.json(
      { 
        success: true,
        emailFound: true,
        message: 'Password reset instructions have been sent to your email.',
        // Remove this in production - only for development
        ...(process.env.NODE_ENV === 'development' && { resetLink })
      },
      { status: 200 }
    );
    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error('❌ Error in forgot password API:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
    // Return success even on error for security (prevent information leakage)
    const response = NextResponse.json(
      { 
        success: true, 
        message: 'If an account exists with this email, you will receive password reset instructions.' 
      },
      { status: 200 }
    );
    return addSecurityHeaders(response);
  }
}



