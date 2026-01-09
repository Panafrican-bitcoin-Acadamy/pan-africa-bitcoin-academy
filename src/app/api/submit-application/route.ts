import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { validateAndNormalizeEmail, sanitizeName } from '@/lib/validation';
import { requireStudent } from '@/lib/session';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      country,
      city,
      birthDate,
      experienceLevel,
      preferredCohort,
      preferredLanguage,
    } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'firstName, lastName, and email are required' },
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
    const emailLower = emailValidation.normalized;

    // Optional: If user is logged in, verify email matches their session
    const session = requireStudent(req);
    if (session) {
      const sessionEmail = session.email.toLowerCase().trim();
      if (sessionEmail !== emailLower) {
        return NextResponse.json(
          { error: 'If you are logged in, you must use your account email address.' },
          { status: 403 }
        );
      }
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

    // Sanitize phone
    const phoneNormalized = phone ? String(phone).replace(/[^\d\s\-\(\)\+]/g, '').trim() : null;

    // Basic phone validation (ensure 7-15 digits)
    if (phoneNormalized) {
      const digits = (phoneNormalized.match(/\d/g) || []).join('');
      if (digits.length < 7 || digits.length > 15) {
        return NextResponse.json(
          { error: 'Invalid phone number length' },
          { status: 400 }
        );
      }
    }

    // Prevent duplicate applications by email or phone (use admin client for reliable queries)
    const [{ data: existingEmail, error: emailError }, existingPhoneResult] = await Promise.all([
      supabaseAdmin
        .from('applications')
        .select('id')
        .eq('email', emailLower)
        .maybeSingle(),
      phoneNormalized
        ? supabaseAdmin
            .from('applications')
            .select('id')
            .eq('phone', phoneNormalized)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const existingPhone = (existingPhoneResult as any)?.data;
    const phoneError = (existingPhoneResult as any)?.error;

    if (emailError || phoneError) {
      console.error('Error checking existing applications:', emailError || phoneError);
      return NextResponse.json(
        { error: 'Failed to validate application' },
        { status: 500 }
      );
    }

    // Check if user already has a profile (they're already registered) - use admin client
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, status')
      .eq('email', emailLower)
      .maybeSingle();

    if (existingEmail?.id || existingPhone?.id) {
      // Check if the existing application is already approved
      const existingApp = existingEmail || existingPhone;
      if (existingApp) {
        const { data: appData } = await supabaseAdmin
          .from('applications')
          .select('status, profile_id')
          .eq('id', existingApp.id)
          .single();
        
        if (appData?.status === 'Approved') {
          return NextResponse.json(
            { 
              error: 'You already have an approved application. Please sign in to access your account.',
              hasProfile: !!existingProfile,
              needsPassword: existingProfile && !existingProfile.status?.includes('Active')
            },
            { status: 409 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'An application with this email or phone already exists and is pending review.' },
        { status: 409 }
      );
    }

    // If profile exists, allow them to apply (they're signed in)
    // The application will be linked to their existing profile on approval
    // Don't block - they can apply even if they have a profile

    // If profile doesn't exist, create one and send verification email
    // This ensures email verification happens before application approval
    if (!existingProfile) {
      const fullName = `${sanitizedFirstName} ${sanitizedLastName}`.trim();
      
      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Expires in 24 hours

      // Create profile with unverified email
      const { data: newProfile, error: profileCreateError } = await supabaseAdmin
        .from('profiles')
        .insert({
          name: fullName,
          email: emailLower,
          phone: phoneNormalized,
          country: country ? String(country).substring(0, 100) : null,
          city: city ? String(city).substring(0, 100) : null,
          status: 'New',
          email_verification_token: verificationToken,
          email_verification_token_expiry: tokenExpiry.toISOString(),
          email_verified_at: null, // Email not verified yet
        })
        .select()
        .single();

      if (profileCreateError) {
        console.error('Error creating profile for application:', profileCreateError);
        // Don't fail application submission if profile creation fails
        // But log it for admin awareness
      } else if (newProfile) {
        // Send verification email
        const emailResult = await sendVerificationEmail({
          userName: fullName,
          userEmail: emailLower,
          verificationToken,
        });

        if (!emailResult.success) {
          console.error('Failed to send verification email:', emailResult.error);
          // Don't fail application submission if email fails
        }
      }
    }

    // Resolve cohort (accepts ID or name). Frontend sends ID. - use admin client
    let cohortId: string | null = null;
    if (preferredCohort) {
      // First try direct ID match
      const { data: byId } = await supabaseAdmin
        .from('cohorts')
        .select('id')
        .eq('id', preferredCohort)
        .maybeSingle();

      if (byId?.id) {
        cohortId = byId.id;
      } else {
        // Fallback: try by name (legacy behavior)
        const { data: byName } = await supabaseAdmin
          .from('cohorts')
          .select('id')
          .eq('name', preferredCohort)
          .maybeSingle();
        if (byName?.id) {
          cohortId = byName.id;
        }
      }
    }

    // Check cohort availability before applying - use admin client
    if (cohortId) {
      const [{ data: cohort, error: cohortError }, { count: enrolledCount }, { count: pendingCount }] = await Promise.all([
        supabaseAdmin
          .from('cohorts')
          .select('id, seats_total')
          .eq('id', cohortId)
          .maybeSingle(),
        supabaseAdmin
          .from('cohort_enrollment')
          .select('*', { count: 'exact', head: true })
          .eq('cohort_id', cohortId),
        supabaseAdmin
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('preferred_cohort_id', cohortId)
          .eq('status', 'Pending'),
      ]);

      if (cohortError) {
        console.error('Error fetching cohort:', cohortError);
        return NextResponse.json(
          { error: 'Failed to validate cohort availability' },
          { status: 500 }
        );
      }

      const seatsTotal = cohort?.seats_total || 0;
      const enrolled = enrolledCount || 0;
      const pending = pendingCount || 0;
      
      // Check if cohort is full: enrolled + pending applications >= total seats
      if (seatsTotal > 0 && (enrolled + pending) >= seatsTotal) {
        return NextResponse.json(
          { error: 'This cohort is full. Please select another cohort.' },
          { status: 409 }
        );
      }
    }

    // Create application using admin client to bypass RLS and ensure reliable inserts
    // The application.id (UUID) will be used as the student identifier across all databases
    // Link to existing profile if user is signed in
    const { data: application, error } = await supabaseAdmin
      .from('applications')
      .insert({
        first_name: sanitizedFirstName,
        last_name: sanitizedLastName,
        email: emailLower,
        phone: phoneNormalized,
        country: country ? String(country).substring(0, 100) : null,
        city: city ? String(city).substring(0, 100) : null,
        birth_date: birthDate || null,
        experience_level: experienceLevel || null,
        preferred_cohort_id: cohortId,
        preferred_language: preferredLanguage || null,
        status: 'Pending',
        profile_id: existingProfile?.id || null, // Link to existing profile if found
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { 
          error: 'Failed to submit application',
          code: error.code,
          ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
        },
        { status: 500 }
      );
    }

    // Check if we created a new profile (which means verification email was sent)
    const profileWasCreated = !existingProfile;
    
    return NextResponse.json(
      { 
        success: true, 
        applicationId: application.id,
        verificationEmailSent: profileWasCreated // Indicate if verification email was sent
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in submit-application API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}

