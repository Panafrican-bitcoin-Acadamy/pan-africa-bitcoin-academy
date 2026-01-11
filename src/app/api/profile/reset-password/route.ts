import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { validatePassword } from '@/lib/passwordValidation';
import { secureEmailInput, secureTextInput, validateUUID } from '@/lib/security-utils';
import { addSecurityHeaders } from '@/lib/security-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    if (!body || typeof body !== 'object') {
      const response = NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    const { token, email, newPassword, confirmPassword } = body;

    // Validate required fields
    if (!token || !email || !newPassword || !confirmPassword) {
      const response = NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Validate token format (should be hex string, 64 chars)
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) {
      const response = NextResponse.json(
        { error: 'Invalid reset token format' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Validate and sanitize email
    const emailValidation = secureEmailInput(email);
    if (!emailValidation.valid || !emailValidation.normalized) {
      const response = NextResponse.json(
        { error: emailValidation.error || 'Invalid email format' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Validate passwords are strings
    if (typeof newPassword !== 'string' || typeof confirmPassword !== 'string') {
      const response = NextResponse.json(
        { error: 'Passwords must be strings' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Validate password length (prevent DoS attacks)
    if (newPassword.length > 128 || confirmPassword.length > 128) {
      const response = NextResponse.json(
        { error: 'Password too long' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    if (newPassword !== confirmPassword) {
      const response = NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Validate strong password requirements
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] || 'Password does not meet security requirements' },
        { status: 400 }
      );
    }

    // Get profile with reset token (use normalized email)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, reset_token, reset_token_expiry')
      .eq('email', emailValidation.normalized)
      .eq('reset_token', token)
      .maybeSingle();

    if (profileError || !profile) {
      const response = NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Check if token is expired
    if (!profile.reset_token_expiry) {
      const response = NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    const expiryDate = new Date(profile.reset_token_expiry);
    if (isNaN(expiryDate.getTime()) || expiryDate < new Date()) {
      const response = NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        password_hash: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      const response = NextResponse.json(
        { error: 'Failed to reset password', details: updateError.message },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }

    const response = NextResponse.json(
      { success: true, message: 'Password has been reset successfully' },
      { status: 200 }
    );
    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error('Error in reset password API:', error);
    
    // Validate error is safe to return
    const errorMessage = error?.message || 'Internal server error';
    const safeError = typeof errorMessage === 'string' && errorMessage.length < 500 
      ? errorMessage 
      : 'Internal server error';
    
    const response = NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && safeError ? { details: safeError } : {})
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}

