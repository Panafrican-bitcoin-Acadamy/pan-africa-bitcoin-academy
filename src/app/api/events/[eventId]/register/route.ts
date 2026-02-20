import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateAndNormalizeEmail, sanitizeName, isValidPhone } from '@/lib/validation';

type RouteParams = {
  params: Promise<{ eventId: string }>;
};

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { eventId } = await params;
    const body = await request.json();

    // Validate eventId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID format' },
        { status: 400 }
      );
    }

    // Fetch event from database
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if event is cohort-based (registration only for non-cohort events)
    if (event.cohort_id) {
      return NextResponse.json(
        { error: 'Registration is not available for cohort-based events' },
        { status: 400 }
      );
    }

    // Check if registration is enabled
    if (!event.is_registration_enabled) {
      return NextResponse.json(
        { error: 'Registration is not enabled for this event' },
        { status: 400 }
      );
    }

    // Check registration deadline
    if (event.registration_deadline) {
      const deadline = new Date(event.registration_deadline);
      if (new Date() > deadline) {
        return NextResponse.json(
          { error: 'Registration deadline has passed' },
          { status: 400 }
        );
      }
    }

    // Validate request body
    const { full_name, email, phone, additional_data } = body;

    if (!full_name || !email) {
      return NextResponse.json(
        { error: 'Full name and email are required' },
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

    // Sanitize full name
    const sanitizedFullName = sanitizeName(full_name, 100);
    if (!sanitizedFullName || sanitizedFullName.length < 2) {
      return NextResponse.json(
        { error: 'Full name must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Validate phone (optional)
    if (phone && !isValidPhone(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Check for duplicate registration (same email for this event)
    const { data: existingRegistration } = await supabaseAdmin
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('email', emailLower)
      .single();

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'You are already registered for this event' },
        { status: 409 }
      );
    }

    // Check max registrations limit
    if (event.max_registrations) {
      const { count } = await supabaseAdmin
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      if (count && count >= event.max_registrations) {
        return NextResponse.json(
          { error: 'Event registration is full' },
          { status: 400 }
        );
      }
    }

    // Insert registration
    const { data: registration, error: insertError } = await supabaseAdmin
      .from('event_registrations')
      .insert({
        event_id: eventId,
        full_name: sanitizedFullName,
        email: emailLower,
        phone: phone || null,
        additional_data: additional_data || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Registration API] Error inserting registration:', insertError);
      return NextResponse.json(
        { error: 'Failed to register. Please try again.', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful',
        registrationId: registration.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Registration API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

