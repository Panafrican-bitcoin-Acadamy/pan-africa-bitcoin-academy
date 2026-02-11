import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/mentors
 * Get all mentors (including inactive)
 */
export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: mentors, error } = await supabaseAdmin
      .from('mentors')
      .select(`
        *,
        mentorship_applications:mentorship_application_id (
          id,
          name,
          email,
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin Mentors API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch mentors', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ mentors: mentors || [] }, { status: 200 });
  } catch (error: any) {
    console.error('[Admin Mentors API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/mentors/[id]
 * Update mentor (activate/deactivate, etc.)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, is_active, ...otherFields } = body;

    if (!id) {
      return NextResponse.json({ error: 'Mentor ID is required' }, { status: 400 });
    }

    const updateData: any = { ...otherFields };
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: mentor, error } = await supabaseAdmin
      .from('mentors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Admin Mentors API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to update mentor', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ mentor }, { status: 200 });
  } catch (error: any) {
    console.error('[Admin Mentors API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

