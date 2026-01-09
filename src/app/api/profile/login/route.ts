import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { setStudentCookie } from '@/lib/session';
import { validateAndNormalizeEmail, validatePassword } from '@/lib/validation';
import { handleApiError } from '@/lib/api-error-handler';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  // Rate limiting
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit(`login:${clientIP}`, RATE_LIMITS.AUTH);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Too many login attempts. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMITS.AUTH.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }
  try {
    const { email, password } = await req.json();

    // Validate email
    const emailValidation = validateAndNormalizeEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error || 'Email is required' },
        { status: 400 }
      );
    }
    const normalizedEmail = emailValidation.normalized!;

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error || 'Password is required' },
        { status: 400 }
      );
    }

    // Look up profile by email (including password_hash for verification)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, email_verified_at, email_verification_token, email_verification_token_expiry, created_at')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Authentication failed', found: false },
        { status: 500 }
      );
    }

    if (!profile) {
      // Don't reveal if email exists or not (security best practice)
      return NextResponse.json(
        { error: 'Invalid email or password', found: false },
        { status: 401 }
      );
    }

    // Check if password needs to be set
    if (!profile.password_hash) {
      // Profile exists but no password set - needs password setup
      return NextResponse.json(
        { 
          error: 'Please set a password for your account. Your application was approved!',
          found: true,
          needsPasswordSetup: true,
          setupPasswordUrl: `/setup-password?email=${encodeURIComponent(profile.email)}`
        },
        { status: 401 }
      );
    }

    // Check if status is "Pending Password Setup"
    if (profile.status === 'Pending Password Setup') {
      return NextResponse.json(
        { 
          error: 'Please complete your registration by setting a password.',
          found: true,
          needsPasswordSetup: true,
          setupPasswordUrl: `/setup-password?email=${encodeURIComponent(profile.email)}`
        },
        { status: 401 }
      );
    }

    // Check if it's an old-style hash (for migration)
    const isOldHash = profile.password_hash.startsWith('hashed_');
    let passwordValid = false;

    if (isOldHash) {
      // Legacy hash format - compare directly (for migration purposes)
      passwordValid = profile.password_hash === `hashed_${password}`;
      // If valid, rehash with bcrypt for future logins
      if (passwordValid) {
        const saltRounds = 10;
        const newHash = await bcrypt.hash(password, saltRounds);
        await supabase
          .from('profiles')
          .update({ password_hash: newHash })
          .eq('id', profile.id);
      }
    } else {
      // Modern bcrypt hash
      passwordValid = await bcrypt.compare(password, profile.password_hash);
    }

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password', found: false },
        { status: 401 }
      );
    }

    // Check email verification status
    // For existing users (grandfathered): if email_verified_at is NULL and profile was created before email verification feature,
    // we consider them verified. For new profiles, email_verified_at must be set.
    const profileCreatedAt = profile.created_at ? new Date(profile.created_at) : null;
    const verificationFeatureDate = new Date('2025-01-15'); // Date when email verification was added
    const isGrandfathered = profileCreatedAt && profileCreatedAt < verificationFeatureDate;
    
    // If email is not verified and not grandfathered, generate token and send verification email
    if (!profile.email_verified_at && !isGrandfathered) {
      // Generate verification token if one doesn't exist or has expired
      let verificationToken = null;
      let needsNewToken = true;
      
      // Check if there's an existing valid token
      if (profile.email_verification_token && profile.email_verification_token_expiry) {
        const expiryDate = new Date(profile.email_verification_token_expiry);
        const now = new Date();
        if (now < expiryDate) {
          // Token is still valid, use existing one
          verificationToken = profile.email_verification_token;
          needsNewToken = false;
        }
      }
      
      // Generate new token if needed
      if (needsNewToken) {
        verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Expires in 24 hours
        
        // Update profile with new token (use admin client to bypass RLS)
        await supabaseAdmin
          .from('profiles')
          .update({
            email_verification_token: verificationToken,
            email_verification_token_expiry: tokenExpiry.toISOString(),
          })
          .eq('id', profile.id);
      }
      
      // Always send verification email when user tries to log in without verification
      if (verificationToken) {
        const emailResult = await sendVerificationEmail({
          userName: profile.name || 'User',
          userEmail: profile.email,
          verificationToken,
        });
        
        if (emailResult.success) {
          return NextResponse.json(
            { 
              error: 'Email verification required',
              found: true,
              needsEmailVerification: true,
              message: 'Please verify your email address before logging in. A verification email has been sent to your inbox. Check your email and click the verification link.',
              verificationUrl: '/verify-email',
              resendVerificationUrl: '/api/profile/resend-verification',
              emailSent: true
            },
            { status: 403 }
          );
        } else {
          console.error('Failed to send verification email during login:', emailResult.error);
          // Still return error but indicate email wasn't sent
          return NextResponse.json(
            { 
              error: 'Email verification required',
              found: true,
              needsEmailVerification: true,
              message: 'Please verify your email address before logging in. Click the button below to receive a verification email.',
              verificationUrl: '/verify-email',
              resendVerificationUrl: '/api/profile/resend-verification',
              emailSent: false
            },
            { status: 403 }
          );
        }
      } else {
        // Fallback if token generation failed
        return NextResponse.json(
          { 
            error: 'Email verification required',
            found: true,
            needsEmailVerification: true,
            message: 'Please verify your email address before logging in. Click the button below to receive a verification email.',
            verificationUrl: '/verify-email',
            resendVerificationUrl: '/api/profile/resend-verification',
            emailSent: false
          },
          { status: 403 }
        );
      }
    }

    // Password is valid - create secure session
    const now = Date.now();
    const session = {
      userId: profile.id,
      email: profile.email.toLowerCase().trim(),
      issuedAt: now,
      lastActive: now,
    };

    const res = NextResponse.json(
      {
        found: true,
        success: true,
        profile: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          country: profile.country,
          city: profile.city,
          status: profile.status,
          photoUrl: profile.photo_url,
        },
      },
      { status: 200 }
    );

    // Set secure HTTP-only session cookie
    setStudentCookie(res, session);

    return res;
  } catch (error: unknown) {
    console.error('Error in profile login API:', error);
    const errorResponse = handleApiError(error);
    return NextResponse.json(
      {
        error: errorResponse.message,
        ...(errorResponse.details ? { details: errorResponse.details } : {}),
      },
      { status: errorResponse.status }
    );
  }
}
