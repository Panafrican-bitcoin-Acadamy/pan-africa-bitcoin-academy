import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, attachRefresh } from '@/lib/adminSession';

/**
 * Update a single cohort session
 * PUT /api/sessions/[sessionId]
 * Body: { session_date?, topic?, instructor?, duration_minutes?, link?, recording_url?, status? }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    const body = await req.json();

    // Extract update mode (default to 'single' if not provided)
    const updateMode = body.update_mode || 'single'; // 'single' or 'shift'

    // Extract allowed fields for update
    const updateData: any = {};
    
    if (body.session_date !== undefined) {
      updateData.session_date = body.session_date;
    }
    if (body.topic !== undefined) {
      updateData.topic = body.topic || null; // Allow null to clear topic
    }
    if (body.instructor !== undefined) {
      updateData.instructor = body.instructor || null; // Allow null to clear instructor
    }
    if (body.duration_minutes !== undefined) {
      const duration = parseInt(body.duration_minutes);
      if (isNaN(duration) || duration < 0) {
        return NextResponse.json(
          { error: 'duration_minutes must be a positive number' },
          { status: 400 }
        );
      }
      updateData.duration_minutes = duration;
    }
    if (body.link !== undefined) {
      updateData.link = body.link || null; // Allow null to clear link
    }
    if (body.recording_url !== undefined) {
      updateData.recording_url = body.recording_url || null; // Allow null to clear recording_url
    }
    if (body.status !== undefined) {
      const validStatuses = ['scheduled', 'completed', 'cancelled', 'rescheduled'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `status must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Check if session exists
    const { data: existingSession, error: fetchError } = await supabaseAdmin
      .from('cohort_sessions')
      .select('id, cohort_id, session_number, session_date')
      .eq('id', sessionId)
      .single();

    if (fetchError || !existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // If updating session_date, validate and check for conflicts
    if (updateData.session_date !== undefined) {
      // Normalize date format (ensure YYYY-MM-DD)
      let normalizedDate: string;
      try {
        const dateObj = new Date(updateData.session_date);
        if (isNaN(dateObj.getTime())) {
          return NextResponse.json(
            { error: 'Invalid date format. Please use YYYY-MM-DD format.' },
            { status: 400 }
          );
        }
        // Format as YYYY-MM-DD
        normalizedDate = dateObj.toISOString().split('T')[0];
        updateData.session_date = normalizedDate;
      } catch (dateError) {
        return NextResponse.json(
          { error: 'Invalid date format. Please use YYYY-MM-DD format.' },
          { status: 400 }
        );
      }

      // Normalize existing session date for comparison
      const existingDate = existingSession.session_date instanceof Date
        ? existingSession.session_date.toISOString().split('T')[0]
        : String(existingSession.session_date).split('T')[0];

      // Only check for conflicts if the date is actually changing
      if (normalizedDate !== existingDate) {
        const { data: conflictingSession, error: conflictError } = await supabaseAdmin
          .from('cohort_sessions')
          .select('id, session_number')
          .eq('cohort_id', existingSession.cohort_id)
          .eq('session_date', normalizedDate)
          .neq('id', sessionId) // Exclude the current session
          .maybeSingle();

        if (conflictError) {
          console.error('Error checking for date conflicts:', conflictError);
          return NextResponse.json(
            { error: 'Failed to validate session date', details: conflictError.message },
            { status: 500 }
          );
        }

        if (conflictingSession) {
          return NextResponse.json(
            { 
              error: `Another session (Session ${conflictingSession.session_number}) already exists on this date for this cohort. Please choose a different date.` 
            },
            { status: 400 }
          );
        }
      }
    }

    // Log update data for debugging (in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('Updating session with data:', updateData, 'Mode:', updateMode);
    }

    // If updating session_date and mode is 'shift', calculate date difference
    let dateDifference = 0;
    if (updateData.session_date && updateMode === 'shift') {
      const oldDate = new Date(existingSession.session_date);
      const newDate = new Date(updateData.session_date);
      dateDifference = Math.round((newDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24)); // Difference in days
    }

    // Update the session
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('cohort_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select(`
        *,
        cohorts (
          id,
          name,
          level,
          status
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating session:', updateError);
      // Check if it's a unique constraint violation
      if (updateError.code === '23505' || updateError.message?.includes('unique constraint')) {
        return NextResponse.json(
          { 
            error: 'A session with this date already exists for this cohort. Please choose a different date.',
            details: updateError.message 
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to update session', details: updateError.message },
        { status: 500 }
      );
    }

    // If shift mode and date was changed, update all subsequent sessions
    if (updateMode === 'shift' && dateDifference !== 0 && updateData.session_date) {
      try {
        // Get all subsequent sessions (higher session_number in same cohort)
        const { data: subsequentSessions, error: fetchSubsequentError } = await supabaseAdmin
          .from('cohort_sessions')
          .select('id, session_number, session_date')
          .eq('cohort_id', existingSession.cohort_id)
          .gt('session_number', existingSession.session_number)
          .order('session_number', { ascending: true });

        if (fetchSubsequentError) {
          console.error('Error fetching subsequent sessions:', fetchSubsequentError);
          // Don't fail the update, just log the error
        } else if (subsequentSessions && subsequentSessions.length > 0) {
          // Update each subsequent session
          const updates = subsequentSessions.map((session: any) => {
            const currentDate = new Date(session.session_date);
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() + dateDifference);
            const newDateString = newDate.toISOString().split('T')[0];

            return supabaseAdmin
              .from('cohort_sessions')
              .update({ session_date: newDateString })
              .eq('id', session.id);
          });

          // Execute all updates
          const updateResults = await Promise.allSettled(updates);
          const failedUpdates = updateResults.filter((result) => result.status === 'rejected');
          
          if (failedUpdates.length > 0) {
            console.error('Some subsequent sessions failed to update:', failedUpdates);
            // Log but don't fail - the main session was updated successfully
          }

          if (process.env.NODE_ENV === 'development') {
            console.log(`Shifted ${subsequentSessions.length} subsequent sessions by ${dateDifference} days`);
          }
        }
      } catch (shiftError: any) {
        console.error('Error shifting subsequent sessions:', shiftError);
        // Don't fail the main update, just log the error
      }
    }

    const res = NextResponse.json(
      { success: true, session: updatedSession },
      { status: 200 }
    );
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('Error in update session API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}


