import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, attachRefresh } from '@/lib/adminSession';
import { validateUUID } from '@/lib/security-utils';
import bcrypt from 'bcryptjs';
import { validatePassword } from '@/lib/passwordValidation';

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
      password,
    } = body;

    // At least one field to update
    const hasUpdates =
      name !== undefined ||
      email !== undefined ||
      phone !== undefined ||
      country !== undefined ||
      city !== undefined ||
      cohort_id !== undefined ||
      status !== undefined ||
      password !== undefined;

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

    // Password update (profile only)
    if (password !== undefined) {
      if (typeof password !== 'string' || password.length === 0) {
        return NextResponse.json({ error: 'Password is required' }, { status: 400 });
      }
      if (password.length > 128) {
        return NextResponse.json({ error: 'Password too long' }, { status: 400 });
      }
      const pv = validatePassword(password);
      if (!pv.isValid) {
        return NextResponse.json({ error: pv.errors[0] || 'Password does not meet requirements' }, { status: 400 });
      }
      const saltRounds = 10;
      profileUpdate.password_hash = await bcrypt.hash(password, saltRounds);
      // If admin sets a password, this link/token should no longer be usable
      profileUpdate.reset_token = null;
      profileUpdate.reset_token_expiry = null;
      // Setting password proves access; keep consistent with setup/reset flows
      profileUpdate.email_verified_at = new Date().toISOString();
    }

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

/**
 * DELETE /api/admin/students/[id]
 * Permanently delete a student from all database tables (profile, students, applications, cohort_enrollment, sats, achievements, etc.).
 * Id is profile_id.
 */
export async function DELETE(
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

    const { data: profile, error: profileFetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('id', profileId)
      .maybeSingle();

    if (profileFetchError || !profile) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const email = profile.email?.toLowerCase();
    if (!email) {
      return NextResponse.json(
        { error: 'Profile has no email; cannot clean up applications' },
        { status: 400 }
      );
    }

    // Null out optional FK references so profile can be deleted (no ON DELETE SET NULL on these)
    await supabaseAdmin.from('sats_rewards').update({ awarded_by: null }).eq('awarded_by', profileId);
    await supabaseAdmin.from('assignment_submissions').update({ graded_by: null }).eq('graded_by', profileId);
    await supabaseAdmin.from('assignments').update({ created_by: null }).eq('created_by', profileId);
    await supabaseAdmin.from('exam_access').update({ granted_by: null }).eq('granted_by', profileId);

    // Remove applications for this email (no FK to profile)
    await supabaseAdmin.from('applications').delete().eq('email', email);

    // Remove event registrations for this email
    await supabaseAdmin.from('event_registrations').delete().eq('email', email);

    // Delete profile; CASCADE will remove: students, cohort_enrollment, sats_rewards (student_id),
    // achievements, chapter_progress, assignment_submissions, exam_access, exam_results, etc.
    const { error: deleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', profileId);

    if (deleteError) {
      console.error('[Delete Student] Profile delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete student', details: deleteError.message },
        { status: 500 }
      );
    }

    const res = NextResponse.json({
      success: true,
      message: 'Student deleted from all records',
    });
    attachRefresh(res, session);
    return res;
  } catch (error: unknown) {
    console.error('[Delete Student] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && error instanceof Error ? { details: error.message } : {}),
      },
      { status: 500 }
    );
  }
}
