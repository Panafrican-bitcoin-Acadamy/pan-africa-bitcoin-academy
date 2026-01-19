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
      return NextResponse.json(
        { error: 'Failed to update session', details: updateError.message },
        { status: 500 }
      );
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


