import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { attachRefresh, requireAdmin } from '@/lib/adminSession';

export async function GET(req: NextRequest) {
  const session = requireAdmin(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let query = supabaseAdmin
    .from('mentorship_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Mentorship list error:', error);
    return NextResponse.json({ error: 'Failed to load mentorship applications' }, { status: 500 });
  }

  const res = NextResponse.json({ applications: data || [] });
  attachRefresh(res, session);
  return res;
}

export async function PATCH(req: NextRequest) {
  const session = requireAdmin(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('mentorship_applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Mentorship update error:', error);
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }

    const res = NextResponse.json({ success: true });
    attachRefresh(res, session);
    return res;
  } catch (error: any) {
    console.error('Mentorship PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

