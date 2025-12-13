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
      cohort_id, // null or "for_all" for everyone, or UUID for specific cohort
      for_all, // boolean: true = for everyone, false = for specific cohort
      chapter_number // optional: chapter number for live-class events
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

    // Create event
    const { data: newEvent, error: createError } = await supabaseAdmin
      .from('events')
      .insert({
        name: name.trim(),
        type: eventType,
        start_time: start_time,
        end_time: end_time || null,
        description: description || null,
        link: link || null,
        recording_url: recording_url || null,
        cohort_id: finalCohortId, // null = for everyone, UUID = for specific cohort
        chapter_number: chapter_number && eventType === 'live-class' ? parseInt(chapter_number) : null,
      })
      .select('*')
      .single();

    if (createError) {
      console.error('Error creating event:', createError);
      return NextResponse.json(
        { error: 'Failed to create event', details: createError.message },
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


    );
  }
}

