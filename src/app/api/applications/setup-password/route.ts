import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { validatePassword } from '@/lib/passwordValidation';

export async function POST(req: NextRequest) {
  try {
    const { email, password, applicationId } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] || 'Password does not meet security requirements' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Find profile by email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, status, password_hash')
      .eq('email', emailLower)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found. Please ensure your application was approved.' },
        { status: 404 }
      );
    }

    // Check if password is already set
    if (profile.password_hash) {
      return NextResponse.json(
        { error: 'Password is already set. Please sign in or use "Forgot Password" if needed.' },
        { status: 400 }
      );
    }

    // Check if application is approved (optional check if applicationId provided)
    if (applicationId) {
      const { data: application } = await supabaseAdmin
        .from('applications')
        .select('status, profile_id')
        .eq('id', applicationId)
        .eq('profile_id', profile.id)
        .single();

      if (!application || application.status !== 'Approved') {
        return NextResponse.json(
          { error: 'Application is not approved yet' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update profile with password and set status to Active
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        password_hash: passwordHash,
        status: 'Active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error setting password:', updateError);
      return NextResponse.json(
        { error: 'Failed to set password', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password set successfully. You can now sign in.',
    });
  } catch (error: any) {
    console.error('Error setting up password:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}







