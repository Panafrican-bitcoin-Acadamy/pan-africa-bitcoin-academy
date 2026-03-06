import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { validatePassword } from '@/lib/passwordValidation';

/**
 * GET /api/applications/setup-password?email=...&token=...
 * Check if this email still needs to set a password. When token is present, it must
 * match the profile's reset_token and not be expired (72h set-password link).
 * Returns needsSetup: true only when profile exists, has no password_hash, and
 * (no token in URL or token valid and not expired). linkExpired: true when token
 * was provided but is invalid or expired.
 */
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    const token = req.nextUrl.searchParams.get('token');
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ needsSetup: false }, { status: 200 });
    }

    const emailLower = email.toLowerCase().trim();

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('password_hash, name, cohort_id, reset_token, reset_token_expiry')
      .eq('email', emailLower)
      .maybeSingle();

    if (token != null && token !== '') {
      const now = new Date();
      const validToken =
        profile?.reset_token != null &&
        profile.reset_token !== '' &&
        profile.reset_token === token &&
        profile.reset_token_expiry != null &&
        new Date(profile.reset_token_expiry) > now;
      if (!validToken) {
        return NextResponse.json({
          needsSetup: false,
          linkExpired: true,
          studentName: null,
          cohortName: null,
        }, { status: 200 });
      }
    }

    // needsSetup only when profile exists AND has no password
    const needsSetup = !!profile && !profile.password_hash;

    let cohortName: string | null = null;
    if (profile?.cohort_id) {
      const { data: cohort } = await supabaseAdmin
        .from('cohorts')
        .select('name')
        .eq('id', profile.cohort_id)
        .maybeSingle();
      cohortName = cohort?.name ?? null;
    }

    return NextResponse.json({
      needsSetup,
      linkExpired: false,
      studentName: needsSetup && profile?.name ? profile.name : null,
      cohortName,
    }, { status: 200 });
  } catch {
    return NextResponse.json({ needsSetup: false }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, token: bodyToken, applicationId } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const token = bodyToken != null && bodyToken !== '' ? bodyToken : null;
    if (!token) {
      return NextResponse.json(
        { error: 'Invalid or expired link. Please use the link from your approval email or ask your admin to send a new link.' },
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

    // Find profile by email and validate set-password token (72h link)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, status, password_hash, reset_token, reset_token_expiry')
      .eq('email', emailLower)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found. Please ensure your application was approved.' },
        { status: 404 }
      );
    }

    const now = new Date();
    const validToken =
      profile.reset_token != null &&
      profile.reset_token !== '' &&
      profile.reset_token === token &&
      profile.reset_token_expiry != null &&
      new Date(profile.reset_token_expiry) > now;
    if (!validToken) {
      return NextResponse.json(
        { error: 'This link has expired. Please ask your admin to send a new password setup link.' },
        { status: 400 }
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

    // Update profile: set password, clear reset token/expiry, set status and email_verified_at
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        password_hash: passwordHash,
        status: 'Active',
        email_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reset_token: null,
        reset_token_expiry: null,
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







