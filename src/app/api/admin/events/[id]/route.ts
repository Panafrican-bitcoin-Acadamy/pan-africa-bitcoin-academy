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
      cohort_id,
      for_all,
      chapter_number
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

    // Update event
    const { data: updatedEvent, error: updateError } = await supabaseAdmin
      .from('events')
      .update({
        name: name.trim(),
        type: eventType,
        start_time: start_time,
        end_time: end_time || null,
        description: description?.trim() || null,
        link: link?.trim() || null,
        recording_url: recording_url?.trim() || null,
        cohort_id: finalCohortId,
        chapter_number: chapter_number && eventType === 'live-class' && !isNaN(parseInt(chapter_number)) ? parseInt(chapter_number) : null,
        updated_at: new Date().toISOString(),
      })
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

    const { error: deleteError } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', eventId);

    if (deleteError) {
      console.error('Error deleting event:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete event', details: deleteError.message },
        { status: 500 }
      );
    }

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
    console.error('Error in delete event API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      },
      { status: 500 }
    );
  }
}

