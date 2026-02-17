import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, attachRefresh } from '@/lib/adminSession';
import { secureTextInput, validateUUID } from '@/lib/security-utils';

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

    const res = NextResponse.json({ mentor }, { status: 200 });
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('[Admin Mentors API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/mentors
 * Create a new mentor
 */
export async function POST(request: NextRequest) {
  try {
    const session = requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, role, type, description, image_url, github, twitter, bio, is_active, mentorship_application_id } = body;

    // Validate type if provided
    const validTypes = ['Mentor', 'Volunteer', 'Guest Lecturer'];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'type must be one of: Mentor, Volunteer, Guest Lecturer' },
        { status: 400 }
      );
    }

    // Default values if not provided
    const finalType = type || 'Mentor';
    const finalRole = role || 'Mentor';
    const finalName = name || null;

    // Sanitize inputs (all optional)
    let nameSanitized: string | null = null;
    if (name) {
      const nameValidation = secureTextInput(name, { required: false, maxLength: 100, minLength: 2 });
      if (!nameValidation.valid) {
        return NextResponse.json(
          { error: nameValidation.error || 'Invalid name format' },
          { status: 400 }
        );
      }
      nameSanitized = nameValidation.sanitized || null;
    }

    let roleSanitized: string | null = null;
    if (role) {
      const roleValidation = secureTextInput(role, { required: false, maxLength: 100, minLength: 2 });
      if (!roleValidation.valid) {
        return NextResponse.json(
          { error: roleValidation.error || 'Invalid role format' },
          { status: 400 }
        );
      }
      roleSanitized = roleValidation.sanitized || null;
    }

    let descriptionSanitized: string | null = null;
    if (description) {
      const descriptionValidation = secureTextInput(description, { maxLength: 500 });
      if (!descriptionValidation.valid) {
        return NextResponse.json(
          { error: descriptionValidation.error || 'Invalid description format' },
          { status: 400 }
        );
      }
      descriptionSanitized = descriptionValidation.sanitized || null;
    }

    let bioSanitized: string | null = null;
    if (bio) {
      const bioValidation = secureTextInput(bio, { maxLength: 2000 });
      if (!bioValidation.valid) {
        return NextResponse.json(
          { error: bioValidation.error || 'Invalid bio format' },
          { status: 400 }
        );
      }
      bioSanitized = bioValidation.sanitized || null;
    }

    // Validate URLs
    const validateURL = (url: string | null | undefined): boolean => {
      if (!url || !url.trim()) return true; // Optional
      try {
        new URL(url.trim());
        return true;
      } catch {
        return false;
      }
    };

    if (image_url && !validateURL(image_url)) {
      return NextResponse.json(
        { error: 'Invalid image_url format' },
        { status: 400 }
      );
    }

    if (github && !validateURL(github)) {
      return NextResponse.json(
        { error: 'Invalid github URL format' },
        { status: 400 }
      );
    }

    if (twitter && !validateURL(twitter)) {
      return NextResponse.json(
        { error: 'Invalid twitter URL format' },
        { status: 400 }
      );
    }

    // Validate mentorship_application_id if provided
    let finalApplicationId: string | null = null;
    if (mentorship_application_id) {
      if (!validateUUID(mentorship_application_id)) {
        return NextResponse.json(
          { error: 'Invalid mentorship_application_id format' },
          { status: 400 }
        );
      }
      // Verify application exists
      const { data: application } = await supabaseAdmin
        .from('mentorship_applications')
        .select('id')
        .eq('id', mentorship_application_id)
        .maybeSingle();
      
      if (!application) {
        return NextResponse.json(
          { error: 'Mentorship application not found' },
          { status: 404 }
        );
      }
      finalApplicationId = mentorship_application_id;
    }

    // Create mentor
    const { data: newMentor, error: createError } = await supabaseAdmin
      .from('mentors')
      .insert({
        name: nameSanitized,
        role: roleSanitized || finalRole,
        type: finalType,
        description: descriptionSanitized,
        image_url: image_url?.trim() || null,
        github: github?.trim() || null,
        twitter: twitter?.trim() || null,
        bio: bioSanitized,
        is_active: is_active !== undefined ? is_active : true,
        mentorship_application_id: finalApplicationId,
      })
      .select('*')
      .single();

    if (createError) {
      console.error('Error creating mentor:', createError);
      return NextResponse.json(
        { error: 'Failed to create mentor', details: createError.message },
        { status: 500 }
      );
    }

    const res = NextResponse.json(
      {
        success: true,
        message: 'Mentor registered successfully',
        mentor: newMentor,
      },
      { status: 200 }
    );
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('[Admin Mentors API] POST Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

