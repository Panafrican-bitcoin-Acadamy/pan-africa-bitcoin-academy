import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireStudent } from '@/lib/session';

/**
 * POST /api/testimonials/submit
 * Student submits a testimonial with a star rating
 */
export async function POST(request: NextRequest) {
  try {
    const student = requireStudent(request);
    if (!student) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { testimonial, rating } = body;

    if (!testimonial || typeof testimonial !== 'string' || testimonial.trim().length < 10) {
      return NextResponse.json(
        { error: 'Testimonial must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const sanitizedText = testimonial.trim().substring(0, 2000);

    // Look up profile id from student session email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', student.email)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Check if student already has a pending or approved testimonial
    const { data: existing } = await supabaseAdmin
      .from('student_testimonials')
      .select('id, is_approved')
      .eq('student_id', profile.id)
      .limit(1);

    if (existing && existing.length > 0) {
      // Update the existing one instead
      const { error: updateError } = await supabaseAdmin
        .from('student_testimonials')
        .update({
          testimonial: sanitizedText,
          rating: Math.round(rating),
          is_approved: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing[0].id);

      if (updateError) {
        console.error('[Testimonial Submit] Update error:', updateError);
        return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Testimonial updated and sent for review' }, { status: 200 });
    }

    // Insert new testimonial
    const { error: insertError } = await supabaseAdmin
      .from('student_testimonials')
      .insert({
        student_id: profile.id,
        testimonial: sanitizedText,
        rating: Math.round(rating),
        is_approved: false,
        is_featured: false,
        display_order: 0,
      });

    if (insertError) {
      console.error('[Testimonial Submit] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to submit testimonial' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Testimonial submitted for review' }, { status: 201 });
  } catch (error: any) {
    console.error('[Testimonial Submit] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/testimonials/submit
 * Get current student's testimonial (if any)
 */
export async function GET(request: NextRequest) {
  try {
    const student = requireStudent(request);
    if (!student) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', student.email)
      .single();

    if (!profile) {
      return NextResponse.json({ testimonial: null }, { status: 200 });
    }

    const { data: testimonial } = await supabaseAdmin
      .from('student_testimonials')
      .select('id, testimonial, rating, is_approved, created_at, updated_at')
      .eq('student_id', profile.id)
      .single();

    return NextResponse.json({ testimonial: testimonial || null }, { status: 200 });
  } catch (error: any) {
    console.error('[Testimonial Get] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
