import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, attachRefresh } from '@/lib/adminSession';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * Update an existing event
 * PUT /api/admin/events/[id]
 */
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;
    const { 
      name, 
      type, 
      start_time, 
      end_time, 
      description, 
      link, 
      recording_url,
      image_url,
      image_alt_text,
      cohort_id,
      for_all,
      chapter_number,
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

    // Build update payload
    const updatePayload: any = {
      name: name.trim(),
      type: eventType,
      start_time: start_time,
      end_time: end_time || null,
      description: description?.trim() || null,
      link: link?.trim() || null,
      recording_url: recording_url?.trim() || null,
      cohort_id: finalCohortId,
      updated_at: new Date().toISOString(),
    };

    // Only include image_url if provided
    if (image_url !== undefined) {
      updatePayload.image_url = image_url || null;
    }

    // Only include image_alt_text if provided
    if (image_alt_text !== undefined) {
      updatePayload.image_alt_text = image_alt_text?.trim() || null;
    }

    // Validate registration fields (only for non-cohort events)
    if (is_registration_enabled !== undefined && is_registration_enabled && finalCohortId !== null) {
      return NextResponse.json(
        { error: 'Registration can only be enabled for events "For Everyone" (non-cohort events)' },
        { status: 400 }
      );
    }

    // Registration fields (only for non-cohort events)
    if (finalCohortId === null) {
      // Only update registration fields if explicitly provided
      if (is_registration_enabled !== undefined) {
        updatePayload.is_registration_enabled = is_registration_enabled;
      }
      if (location !== undefined) {
        updatePayload.location = location?.trim() || null;
      }
      if (event_date !== undefined) {
        updatePayload.event_date = event_date || null;
      }
      if (max_registrations !== undefined) {
        updatePayload.max_registrations = max_registrations ? parseInt(max_registrations) : null;
      }
      if (registration_deadline !== undefined) {
        updatePayload.registration_deadline = registration_deadline || null;
      }
      if (form_config !== undefined) {
        if (form_config) {
          // Validate form_config is valid JSON
          try {
            const parsed = typeof form_config === 'string' ? JSON.parse(form_config) : form_config;
            updatePayload.form_config = parsed;
          } catch (e) {
            return NextResponse.json(
              { error: 'Invalid form_config JSON format' },
              { status: 400 }
            );
          }
        } else {
          updatePayload.form_config = null;
        }
      }
    } else {
      // If event is cohort-based, disable registration
      if (is_registration_enabled !== undefined) {
        updatePayload.is_registration_enabled = false;
      }
      // Clear registration fields for cohort events
      updatePayload.location = null;
      updatePayload.event_date = null;
      updatePayload.max_registrations = null;
      updatePayload.registration_deadline = null;
      updatePayload.form_config = null;
    }

    // Note: chapter_number is NOT in events table - it's only in assignments table
    // So we don't include it here

    // Update event
    const { data: updatedEvent, error: updateError } = await supabaseAdmin
      .from('events')
      .update(updatePayload)
      .eq('id', eventId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating event:', updateError);
      return NextResponse.json(
        { error: 'Failed to update event', details: updateError.message },
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
        .maybeSingle();
      cohortName = cohort?.name || null;
    }

    const res = NextResponse.json(
      {
        success: true,
        message: finalCohortId 
          ? `Event updated for cohort: ${cohortName || 'Unknown'}` 
          : 'Event updated for everyone',
        event: {
          id: updatedEvent.id,
          name: updatedEvent.name,
          type: updatedEvent.type,
          start_time: updatedEvent.start_time,
          end_time: updatedEvent.end_time,
          cohort_id: updatedEvent.cohort_id,
          isForEveryone: !updatedEvent.cohort_id,
          cohortName: cohortName,
        },
      },
      { status: 200 }
    );
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('Error in update event API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}

/**
 * Delete an event
 * DELETE /api/admin/events/[id]
 */
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;

    // First, fetch the event to get the image URL before deleting
    const { data: event, error: fetchError } = await supabaseAdmin
      .from('events')
      .select('id, name, image_url')
      .eq('id', eventId)
      .maybeSingle();

    if (fetchError) {
      console.error('[Delete Event] Error fetching event:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch event', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Delete associated image from storage if it exists
    if (event.image_url) {
      try {
        // Extract file path from the URL
        // URLs are typically: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
        const urlParts = event.image_url.split('/storage/v1/object/public/');
        if (urlParts.length === 2) {
          const pathParts = urlParts[1].split('/');
          const bucketName = pathParts[0];
          const filePath = pathParts.slice(1).join('/');

          // Try to delete from events bucket first
          let deleteError = null;
          ({ error: deleteError } = await supabaseAdmin.storage
            .from(bucketName)
            .remove([filePath]));

          // If not found in events bucket, try profile_img/events/ path
          if (deleteError && bucketName === 'profile_img') {
            // Already tried profile_img, check if it's in events/ subfolder
            const eventsPath = `events/${filePath.split('/').pop()}`;
            ({ error: deleteError } = await supabaseAdmin.storage
              .from('profile_img')
              .remove([eventsPath]));
          }

          if (deleteError) {
            // Log but don't fail the deletion - image might already be deleted or not exist
            console.warn('[Delete Event] Warning: Could not delete image from storage:', {
              eventId,
              imageUrl: event.image_url,
              error: deleteError.message,
            });
          } else {
            console.log('[Delete Event] Successfully deleted image from storage:', {
              eventId,
              imageUrl: event.image_url,
            });
          }
        }
      } catch (imageError: any) {
        // Log but don't fail the deletion - image deletion is optional
        console.warn('[Delete Event] Warning: Error deleting image:', {
          eventId,
          imageUrl: event.image_url,
          error: imageError.message,
        });
      }
    }

    // Delete the event from database
    const { error: deleteError } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', eventId);

    if (deleteError) {
      console.error('[Delete Event] Error deleting event from database:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete event from database', details: deleteError.message },
        { status: 500 }
      );
    }

    console.log('[Delete Event] Successfully deleted event:', {
      eventId,
      eventName: event.name,
      adminId: session.adminId,
      adminEmail: session.email,
      timestamp: new Date().toISOString(),
    });

    const res = NextResponse.json(
      {
        success: true,
        message: 'Event deleted successfully',
      },
      { status: 200 }
    );
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('[Delete Event] Error in delete event API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}

