import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, attachRefresh } from '@/lib/adminSession';

/**
 * Create a new event
 * Events can be:
 * - For everyone: Set cohort_id to null
 * - For specific cohort: Set cohort_id to the cohort UUID
 */
export async function POST(req: NextRequest) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      name, 
      type, 
      start_time, 
      end_time, 
      description, 
      link, 
      recording_url,
      image_url, // optional: URL of the event image
      image_alt_text, // optional: Alt text for accessibility
      cohort_id, // null or "for_all" for everyone, or UUID for specific cohort
      for_all, // boolean: true = for everyone, false = for specific cohort
      chapter_number, // optional: chapter number for live-class events
      // Registration fields
      is_registration_enabled,
      location,
      event_date,
      max_registrations,
      registration_deadline,
      form_config
    } = await req.json();

    // Validate required fields
    if (!name || !start_time) {
      return NextResponse.json(
        { error: 'name and start_time are required' },
        { status: 400 }
      );
    }

    // Validate event type
    const validTypes = ['live-class', 'assignment', 'community', 'workshop', 'deadline', 'quiz', 'cohort'];
    const eventType = type && validTypes.includes(type.toLowerCase()) 
      ? type.toLowerCase() 
      : 'community';

    // Determine if event is for everyone or specific cohort
    let finalCohortId: string | null = null;
    
    // Handle "for_all" string or boolean
    if (for_all === true || for_all === 'true' || cohort_id === 'for_all' || cohort_id === null || cohort_id === '') {
      finalCohortId = null; // Event is for everyone
    } else if (cohort_id) {
      // Validate cohort_id if provided
      const { data: cohort, error: cohortError } = await supabaseAdmin
        .from('cohorts')
        .select('id, name')
        .eq('id', cohort_id)
        .maybeSingle();

      if (cohortError || !cohort) {
        return NextResponse.json(
          { error: 'Invalid cohort_id. Cohort not found.' },
          { status: 400 }
        );
      }
      
      finalCohortId = cohort_id; // Event is for specific cohort
    }

    // Validate registration fields (only for non-cohort events)
    if (is_registration_enabled && finalCohortId !== null) {
      return NextResponse.json(
        { error: 'Registration can only be enabled for events "For Everyone" (non-cohort events)' },
        { status: 400 }
      );
    }

    // Create event payload - only include fields that exist in database
    const eventPayload: any = {
      name: name.trim(),
      type: eventType,
      start_time: start_time,
      end_time: end_time || null,
      description: description || null,
      link: link || null,
      recording_url: recording_url || null,
      cohort_id: finalCohortId, // null = for everyone, UUID = for specific cohort
    };

    // Only include image_url if provided (column may not exist if migration not run)
    if (image_url) {
      eventPayload.image_url = image_url;
    }

    // Only include image_alt_text if provided (column may not exist if migration not run)
    if (image_alt_text && image_alt_text.trim()) {
      eventPayload.image_alt_text = image_alt_text.trim();
    }

    // Registration fields (only for non-cohort events)
    if (finalCohortId === null) {
      // Only set registration fields if explicitly provided
      if (is_registration_enabled !== undefined) {
        eventPayload.is_registration_enabled = is_registration_enabled && finalCohortId === null;
      }
      if (location) {
        eventPayload.location = location.trim();
      }
      if (event_date) {
        eventPayload.event_date = event_date;
      }
      if (max_registrations !== undefined && max_registrations !== null) {
        eventPayload.max_registrations = parseInt(max_registrations);
      }
      if (registration_deadline) {
        eventPayload.registration_deadline = registration_deadline;
      }
      if (form_config) {
        // Validate form_config is valid JSON
        try {
          const parsed = typeof form_config === 'string' ? JSON.parse(form_config) : form_config;
          eventPayload.form_config = parsed;
        } catch (e) {
          return NextResponse.json(
            { error: 'Invalid form_config JSON format' },
            { status: 400 }
          );
        }
      }
    }

    // Note: chapter_number is NOT in events table - it's only in assignments table
    // So we don't include it here

    // Create event
    const { data: newEvent, error: createError } = await supabaseAdmin
      .from('events')
      .insert(eventPayload)
      .select('*')
      .single();

    if (createError) {
      console.error('Error creating event:', {
        error: createError,
        message: createError.message,
        code: createError.code,
        details: createError.details,
        hint: createError.hint,
        data: {
          name,
          type: eventType,
          start_time,
          end_time,
          hasImageUrl: !!image_url,
          hasImageAltText: !!image_alt_text,
          cohort_id: finalCohortId,
        }
      });
      return NextResponse.json(
        { 
          error: 'Failed to create event', 
          details: createError.message,
          hint: createError.hint || 'Check if all required database columns exist (image_url, image_alt_text)',
        },
        { status: 500 }
      );
    }

    // Get cohort name if event is for specific cohort
    let cohortName = null;
    if (finalCohortId) {
      const { data: cohort } = await supabaseAdmin
        .from('cohorts')
        .select('name')
        .eq('id', finalCohortId)
        .single();
      cohortName = cohort?.name || null;
    }

    const res = NextResponse.json(
      {
        success: true,
        message: finalCohortId 
          ? `Event created for cohort: ${cohortName || 'Unknown'}` 
          : 'Event created for everyone',
        event: {
          id: newEvent.id,
          name: newEvent.name,
          type: newEvent.type,
          start_time: newEvent.start_time,
          end_time: newEvent.end_time,
          cohort_id: newEvent.cohort_id,
          isForEveryone: !newEvent.cohort_id,
          cohortName: cohortName,
        },
      },
      { status: 200 }
    );
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('Error in create event API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}


