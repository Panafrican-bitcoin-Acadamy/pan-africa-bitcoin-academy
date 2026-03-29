import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireStudent } from '@/lib/session';
import { secureTextInput } from '@/lib/security-utils';
import { sendExamRetakeRequestToAdmin } from '@/lib/email';

/**
 * POST — Student requests a new final exam session (e.g. after 2-hour timeout).
 * Requires active student session; must have exam access and not have submitted.
 */
export async function POST(req: NextRequest) {
  try {
    const session = requireStudent(req);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let reason: string | null = null;
    try {
      const body = await req.json();
      if (body?.reason != null && String(body.reason).trim()) {
        const v = secureTextInput(String(body.reason), { maxLength: 500 });
        if (!v.valid) {
          return NextResponse.json({ error: v.error || 'Invalid reason' }, { status: 400 });
        }
        reason = v.sanitized || null;
      }
    } catch {
      /* empty body ok */
    }

    const email = session.email.toLowerCase().trim();

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: studentRow } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (!studentRow) {
      return NextResponse.json({ error: 'Not enrolled' }, { status: 403 });
    }

    const { data: examResult } = await supabaseAdmin
      .from('exam_results')
      .select('id')
      .eq('student_id', profile.id)
      .maybeSingle();

    if (examResult) {
      return NextResponse.json(
        { error: 'Exam already submitted; retake is not available through this flow.' },
        { status: 400 },
      );
    }

    const { data: examAccess } = await supabaseAdmin
      .from('exam_access')
      .select('id')
      .eq('student_id', profile.id)
      .maybeSingle();

    if (!examAccess) {
      return NextResponse.json({ error: 'Exam access not granted' }, { status: 403 });
    }

    const { data: chapter21 } = await supabaseAdmin
      .from('chapter_progress')
      .select('is_completed')
      .eq('student_id', profile.id)
      .eq('chapter_number', 21)
      .maybeSingle();

    if (!chapter21?.is_completed) {
      return NextResponse.json({ error: 'Complete Chapter 21 before requesting a retake.' }, { status: 403 });
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('exam_retake_requests')
      .insert({
        student_id: profile.id,
        reason: reason || 'time_expired',
        status: 'pending',
      })
      .select('id, created_at')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({
          success: true,
          alreadyPending: true,
          message: 'You already have a pending retake request.',
        });
      }
      console.error('exam_retake_requests insert:', insertError);
      return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
    }

    await sendExamRetakeRequestToAdmin({
      studentEmail: profile.email,
      studentName: profile.name || undefined,
      reason: reason || 'Session time expired (2-hour limit)',
      requestId: inserted.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Retake request sent. An administrator will review it.',
      requestId: inserted.id,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error';
    console.error('retake-request:', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
