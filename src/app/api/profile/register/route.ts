import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { validatePassword } from '@/lib/passwordValidation';

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
      .eq('email', email.toLowerCase().trim())
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

    // Create profile - minimal data, phone is empty/null
    // This is just account creation, not academy enrollment
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        name: `${firstName} ${lastName}`.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        phone: null, // Keep phone empty - will be filled during application
        status: 'New', // Just signed up, not enrolled yet
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

    // Don't create student record automatically
    // Student record will be created when user applies and gets accepted
    // This allows users to sign up without being students yet

    // Return success - profile was created successfully
    return NextResponse.json(
      { success: true, profileId: profile.id },
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

