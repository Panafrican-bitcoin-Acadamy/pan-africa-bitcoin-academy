import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, attachRefresh } from '@/lib/adminSession';
import { validateUUID } from '@/lib/security-utils';

/**
 * PATCH /api/admin/students/[id]
 * Update a student's data (profile + students table). Id is profile_id (same as students.id in this app).
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: profileId } = await context.params;
    if (!profileId || !validateUUID(profileId)) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    const body = await req.json();
    const {
      name,
      email,
      phone,
      country,
      city,
      cohort_id,
      status,
    } = body;

    // At least one field to update
    const hasUpdates =
      name !== undefined ||
      email !== undefined ||
      phone !== undefined ||
      country !== undefined ||
      city !== undefined ||
      cohort_id !== undefined ||
      status !== undefined;

    if (!hasUpdates) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Build profile update object (only include provided fields)
    const profileUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) profileUpdate.name = typeof name === 'string' ? name.trim() : null;
    if (email !== undefined) profileUpdate.email = typeof email === 'string' ? email.toLowerCase().trim() : null;
    if (phone !== undefined) profileUpdate.phone = typeof phone === 'string' ? phone.trim() || null : null;
    if (country !== undefined) profileUpdate.country = typeof country === 'string' ? country.trim() || null : null;
    if (city !== undefined) profileUpdate.city = typeof city === 'string' ? city.trim() || null : null;
    if (cohort_id !== undefined) profileUpdate.cohort_id = cohort_id || null;
    if (status !== undefined) profileUpdate.status = typeof status === 'string' ? status.trim() : null;

    if (profileUpdate.email === '') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (profileUpdate.name === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Update profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdate)
      .eq('id', profileId);

    if (profileError) {
      console.error('[Update Student] Profile update error:', profileError);
      return NextResponse.json(
        { error: 'Failed to update profile', details: profileError.message },
        { status: 500 }
      );
    }

    // Update students table (same id as profile_id in this app)
    const studentUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) studentUpdate.name = typeof name === 'string' ? name.trim() : null;
    if (email !== undefined) studentUpdate.email = typeof email === 'string' ? email.toLowerCase().trim() : null;
    if (phone !== undefined) studentUpdate.phone = typeof phone === 'string' ? phone.trim() || null : null;
    if (country !== undefined) studentUpdate.country = typeof country === 'string' ? country.trim() || null : null;
    if (city !== undefined) studentUpdate.city = typeof city === 'string' ? city.trim() || null : null;
    if (cohort_id !== undefined) studentUpdate.cohort_id = cohort_id || null;
    if (status !== undefined) studentUpdate.status = typeof status === 'string' ? status.trim() : null;

    const { error: studentError } = await supabaseAdmin
      .from('students')
      .update(studentUpdate)
      .eq('profile_id', profileId);

    if (studentError) {
      console.error('[Update Student] Students update error:', studentError);
      return NextResponse.json(
        { error: 'Failed to update student record', details: studentError.message },
        { status: 500 }
      );
    }

    // If cohort changed, update cohort_enrollment (student_id references profiles.id)
    if (cohort_id !== undefined) {
      await supabaseAdmin
        .from('cohort_enrollment')
        .delete()
        .eq('student_id', profileId);
      if (cohort_id) {
        await supabaseAdmin
          .from('cohort_enrollment')
          .insert({ cohort_id, student_id: profileId });
      }
    }

    const res = NextResponse.json({
      success: true,
      message: 'Student data updated successfully',
    });
    attachRefresh(res, session);
    return res;
  } catch (error: unknown) {
    console.error('[Update Student] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && error instanceof Error ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}
