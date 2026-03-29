import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminSession';

/**
 * GET — List exam retake requests (pending first, then recent).
 */
export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    let query = supabaseAdmin
      .from('exam_retake_requests')
      .select('id, student_id, reason, status, created_at, resolved_at, resolved_by, admin_note')
      .order('created_at', { ascending: false })
      .limit(150);

    if (statusFilter === 'pending' || statusFilter === 'approved' || statusFilter === 'rejected') {
      query = query.eq('status', statusFilter);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error('retake-requests list:', error);
      return NextResponse.json({ error: 'Failed to load requests' }, { status: 500 });
    }

    const list = rows || [];
    const ids = [...new Set(list.map((r) => r.student_id))];
    let profileMap: Record<string, { name: string | null; email: string | null }> = {};

    if (ids.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, name, email')
        .in('id', ids);

      profileMap = Object.fromEntries(
        (profiles || []).map((p) => [p.id, { name: p.name, email: p.email }]),
      );
    }

    const requests = list.map((r) => ({
      ...r,
      studentName: profileMap[r.student_id]?.name ?? null,
      studentEmail: profileMap[r.student_id]?.email ?? null,
    }));

    requests.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json({ requests });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
