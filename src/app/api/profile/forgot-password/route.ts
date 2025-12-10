import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    // For security, don't reveal if email exists
    // Always return success message
    if (profileError || !profile) {
      // Still return success to prevent email enumeration
      return NextResponse.json(
        { 
          success: true, 
          message: 'If an account exists with this email, you will receive password reset instructions.' 
        },
        { status: 200 }
      );
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token expires in 1 hour

    // Store reset token in database
    // Note: You'll need to add reset_token and reset_token_expiry columns to profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry.toISOString(),
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error storing reset token:', updateError);
      // Still return success for security
      return NextResponse.json(
        { 
          success: true, 
          message: 'If an account exists with this email, you will receive password reset instructions.' 
        },
        { status: 200 }
      );
    }

    // In production, send email with reset link
    // For now, we'll log it (remove in production!)
    const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    
    console.log('Password reset link (DEV ONLY - remove in production):', resetLink);
    
    // TODO: Integrate with email service
    // await sendPasswordResetEmail(profile.email, profile.name, resetLink);

    return NextResponse.json(
      { 
        success: true, 
        message: 'If an account exists with this email, you will receive password reset instructions.',
        // Remove this in production - only for development
        ...(process.env.NODE_ENV === 'development' && { resetLink })
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in forgot password API:', error);
    // Return success even on error for security
    return NextResponse.json(
      { 
        success: true, 
        message: 'If an account exists with this email, you will receive password reset instructions.' 
      },
      { status: 200 }
    );
  }
}

