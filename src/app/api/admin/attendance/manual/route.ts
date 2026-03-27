import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminSession';
import { supabaseAdmin } from '@/lib/supabase';
import { validateUUID } from '@/lib/security-utils';

type AttendanceUpdate = {
  studentId: string;
  attended: boolean;
};

export async function POST(req: NextRequest) {
  try {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const sessionId = body?.sessionId as string | undefined;
    const updates = (body?.updates || []) as AttendanceUpdate[];

    if (!sessionId || !validateUUID(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const validUpdates = updates.filter(
      (u) => u && typeof u.studentId === 'string' && validateUUID(u.studentId) && typeof u.attended === 'boolean'
    );
    if (validUpdates.length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    const studentIds = [...new Set(validUpdates.map((u) => u.studentId))];
    const { data: profiles, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id,email,name')
      .in('id', studentIds);
    if (profileErr) {
      return NextResponse.json({ error: 'Failed to load profiles' }, { status: 500 });
    }
    const profileById = new Map((profiles || []).map((p: any) => [p.id, p]));

    const toUpsert = validUpdates
      .filter((u) => u.attended)
      .map((u) => {
        const profile = profileById.get(u.studentId);
        return {
          student_id: u.studentId,
          event_id: sessionId,
          email: profile?.email || null,
          name: profile?.name || null,
          // Minimal values to indicate attendance was manually marked.
          join_time: new Date().toISOString(),
          leave_time: null,
          duration_minutes: 1,
        };
      });

    const toDeleteStudentIds = validUpdates.filter((u) => !u.attended).map((u) => u.studentId);

    if (toUpsert.length > 0) {
      const { error: upsertErr } = await supabaseAdmin
        .from('attendance')
        .upsert(toUpsert, { onConflict: 'student_id,event_id' });
      if (upsertErr) {
        return NextResponse.json({ error: `Failed to save attended students: ${upsertErr.message}` }, { status: 500 });
      }
    }

    if (toDeleteStudentIds.length > 0) {
      const { error: delErr } = await supabaseAdmin
        .from('attendance')
        .delete()
        .eq('event_id', sessionId)
        .in('student_id', toDeleteStudentIds);
      if (delErr) {
        return NextResponse.json({ error: `Failed to clear absent students: ${delErr.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      updated: validUpdates.length,
      attendedCount: toUpsert.length,
      notAttendedCount: toDeleteStudentIds.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

