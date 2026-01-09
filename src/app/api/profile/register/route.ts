import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { validatePassword } from '@/lib/passwordValidation';
import { validateAndNormalizeEmail, sanitizeName } from '@/lib/validation';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, password } = await req.json();

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'firstName, lastName, and email are required' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
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

    // Sanitize names
    const sanitizedFirstName = sanitizeName(firstName, 50);
    const sanitizedLastName = sanitizeName(lastName, 50);
    
    if (!sanitizedFirstName || sanitizedFirstName.length < 2) {
      return NextResponse.json(
        { error: 'First name must be at least 2 characters and contain only letters' },
        { status: 400 }
      );
    }
    
    if (!sanitizedLastName || sanitizedLastName.length < 2) {
      return NextResponse.json(
        { error: 'Last name must be at least 2 characters and contain only letters' },
        { status: 400 }
      );
    }

    // Validate strong password requirements
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] || 'Password does not meet security requirements' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: 'Failed to create profile', details: profileError.message },
        { status: 500 }
      );
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
    return NextResponse.json(
      { 
        success: true, 
        profileId: profile.id,
        emailVerificationSent: emailResult.success,
        message: 'Account created successfully. Please check your email to verify your address.'
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in profile register API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create profile',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}

