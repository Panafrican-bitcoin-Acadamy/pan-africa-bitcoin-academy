import { NextRequest, NextResponse } from 'next/server';
import { attachRefresh, requireAdmin } from '@/lib/adminSession';

export async function GET(req: NextRequest) {
  const session = requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const res = NextResponse.json({ admin: session });
  attachRefresh(res, session);
  return res;
}


