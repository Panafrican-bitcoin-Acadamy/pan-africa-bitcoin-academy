import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { validatePassword } from '@/lib/passwordValidation';
import { validateAndNormalizeEmail, sanitizeName } from '@/lib/validation';
import { sendVerificationEmail } from '@/lib/email';
import { secureEmailInput, secureNameInput, validateRequestBody, addSecurityHeaders } from '@/lib/security-utils';
import crypto from 'crypto';

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

    const { firstName, lastName, email, password } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      const response = NextResponse.json(
        { error: 'firstName, lastName, email, and password are required' },
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

    // Validate and sanitize names
    const firstNameValidation = secureNameInput(firstName, 50);
    if (!firstNameValidation.valid || !firstNameValidation.sanitized) {
      const response = NextResponse.json(
        { error: firstNameValidation.error || 'First name is invalid' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    const lastNameValidation = secureNameInput(lastName, 50);
    if (!lastNameValidation.valid || !lastNameValidation.sanitized) {
      const response = NextResponse.json(
        { error: lastNameValidation.error || 'Last name is invalid' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    const sanitizedFirstName = firstNameValidation.sanitized;
    const sanitizedLastName = lastNameValidation.sanitized;

    // Validate password type and length
    if (typeof password !== 'string') {
      const response = NextResponse.json(
        { error: 'Password must be a string' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Limit password length (prevent DoS)
    if (password.length > 128) {
      const response = NextResponse.json(
        { error: 'Password too long' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Validate strong password requirements
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      const response = NextResponse.json(
        { error: passwordValidation.errors[0] || 'Password does not meet security requirements' },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', emailValidation.normalized)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password using bcrypt with salt rounds
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Expires in 24 hours

    // Create profile - minimal data, phone is empty/null
    // This is just account creation, not academy enrollment
    // Email is NOT verified yet - user must verify via email
    const { data: newProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        name: `${sanitizedFirstName} ${sanitizedLastName}`,
        email: emailValidation.normalized,
        password_hash: passwordHash,
        phone: null, // Keep phone empty - will be filled during application
        status: 'New', // Just signed up, not enrolled yet
        email_verification_token: verificationToken,
        email_verification_token_expiry: tokenExpiry.toISOString(),
        email_verified_at: null, // Email not verified yet
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      const response = NextResponse.json(
        { error: 'Failed to create profile', details: profileError.message },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }

    const profile = newProfile;

    // Send verification email
    const emailResult = await sendVerificationEmail({
      userName: `${sanitizedFirstName} ${sanitizedLastName}`,
      userEmail: emailValidation.normalized,
      verificationToken,
    });

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Don't fail registration if email fails - user can request resend
      // But log the error for admin awareness
    }

    // Don't create student record automatically
    // Student record will be created when user applies and gets accepted
    // This allows users to sign up without being students yet

    // Return success - profile was created successfully
    // Note: Email verification is required before application approval
    const response = NextResponse.json(
      { 
        success: true, 
        profileId: profile.id,
        emailVerificationSent: emailResult.success,
        message: 'Account created successfully. Please check your email to verify your address.'
      },
      { status: 200 }
    );
    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error('Error in profile register API:', error);
    
    // Validate error is safe to return
    const errorMessage = error?.message || 'Failed to create profile';
    const safeError = typeof errorMessage === 'string' && errorMessage.length < 500 
      ? errorMessage 
      : 'Failed to create profile';
    
    const response = NextResponse.json(
      { 
        error: 'Failed to create profile',
        ...(process.env.NODE_ENV === 'development' && safeError ? { details: safeError } : {})
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}

