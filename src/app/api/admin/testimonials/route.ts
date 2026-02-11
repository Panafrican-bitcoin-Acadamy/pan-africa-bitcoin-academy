import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET /api/admin/testimonials
 * Get all testimonials with student information
 */
export async function GET(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: testimonials, error } = await supabaseAdmin
      .from('student_testimonials')
      .select(`
        *,
        profiles:student_id (
          id,
          name,
          email,
          student_id
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin Testimonials API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch testimonials', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ testimonials: testimonials || [] }, { status: 200 });
  } catch (error: any) {
    console.error('[Admin Testimonials API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/testimonials/[id]
 * Update testimonial (approve, feature, etc.)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, is_approved, is_featured, display_order } = body;

    if (!id) {
      return NextResponse.json({ error: 'Testimonial ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (is_approved !== undefined) updateData.is_approved = is_approved;
    if (is_featured !== undefined) updateData.is_featured = is_featured;
    if (display_order !== undefined) updateData.display_order = display_order;

    const { data: testimonial, error } = await supabaseAdmin
      .from('student_testimonials')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Admin Testimonials API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to update testimonial', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ testimonial }, { status: 200 });
  } catch (error: any) {
    console.error('[Admin Testimonials API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

