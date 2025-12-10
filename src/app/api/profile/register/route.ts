import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, password } = await req.json();

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'firstName, lastName, and email are required' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password is required and must be at least 6 characters' },
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

    // Create profile - simplified, no student_id
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        name: `${firstName} ${lastName}`.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        status: 'New',
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
      { error: 'Failed to create profile', details: error.message },
      { status: 500 }
    );
  }
}

