import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/admin/assignments/create
 * Create a new assignment (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const {
      email, // Admin email
      title,
      description,
      question,
      searchAddress,
      correctAnswer,
      chapterNumber,
      chapterSlug,
      points = 10,
      dueDate,
      cohortId,
    } = await req.json();

    if (!email || !title || !question || !correctAnswer) {
      return NextResponse.json(
        {
          error:
            'Email, title, question, and correctAnswer are required fields',
        },
        { status: 400 }
      );
    }

    // Verify admin
    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get admin profile ID
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    // Create assignment
    const { data: assignment, error: createError } = await supabaseAdmin
      .from('assignments')
      .insert({
        title,
        description,
        question,
        search_address: searchAddress || null,
        correct_answer: correctAnswer,
        chapter_number: chapterNumber || null,
        chapter_slug: chapterSlug || null,
        points,
        due_date: dueDate || null,
        cohort_id: cohortId || null,
        created_by: profile?.id || null,
        status: 'active',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating assignment:', createError);
      return NextResponse.json(
        { error: 'Failed to create assignment', details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      assignment,
    });
  } catch (error: any) {
    console.error('Error in create assignment API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
