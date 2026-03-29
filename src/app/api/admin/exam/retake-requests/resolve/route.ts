import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';
import { validateUUID, secureTextInput } from '@/lib/security-utils';
import { sendExamRetakeDecisionToStudent } from '@/lib/email';

/**
 * POST — Approve or reject an exam retake request.
 * Approve: marks request resolved and sets profiles.exam_timer_reset_at so the client starts a fresh 2h window.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, action, note } = body as {
      requestId?: string;
      action?: string;
      note?: string | null;
    };

    if (!requestId || !validateUUID(requestId)) {
      return NextResponse.json({ error: 'Invalid request id' }, { status: 400 });
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });
    }

    let adminNote: string | null = null;
    if (note != null && String(note).trim()) {
      const v = secureTextInput(String(note), { maxLength: 500 });
      if (!v.valid) {
        return NextResponse.json({ error: v.error || 'Invalid note' }, { status: 400 });
      }
      adminNote = v.sanitized || null;
    }

    const { data: row, error: fetchErr } = await supabaseAdmin
      .from('exam_retake_requests')
      .select('id, student_id, status')
      .eq('id', requestId)
      .single();

    if (fetchErr || !row) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (row.status !== 'pending') {
      return NextResponse.json({ error: 'Request already resolved' }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (action === 'approve') {
      const { error: profileErr } = await supabaseAdmin
        .from('profiles')
        .update({ exam_timer_reset_at: now })
        .eq('id', row.student_id);

      if (profileErr) {
        console.error('exam_timer_reset_at update:', profileErr);
        return NextResponse.json({ error: 'Failed to apply retake' }, { status: 500 });
      }
    }

    const { error: updErr } = await supabaseAdmin
      .from('exam_retake_requests')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        resolved_at: now,
        resolved_by: admin.email,
        admin_note: adminNote,
      })
      .eq('id', requestId)
      .eq('status', 'pending');

    if (updErr) {
      console.error('exam_retake_requests resolve:', updErr);
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, name')
      .eq('id', row.student_id)
      .single();

    if (profile?.email) {
      await sendExamRetakeDecisionToStudent({
        studentEmail: profile.email,
        studentName: profile.name || undefined,
        approved: action === 'approve',
        adminNote,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        action === 'approve'
          ? 'Retake approved. When the student opens the exam again they start from question 1 with a new 2-hour timer.'
          : 'Request rejected.',
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
