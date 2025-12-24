import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

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

    const emailLower = email.toLowerCase().trim();
    const phoneNormalized = phone ? String(phone).trim() : null;

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
        first_name: firstName,
        last_name: lastName,
        email: emailLower,
        phone: phoneNormalized,
        country: country || null,
        city: city || null,
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

    return NextResponse.json(
      { success: true, applicationId: application.id },
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

