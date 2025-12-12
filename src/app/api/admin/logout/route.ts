import { NextRequest, NextResponse } from 'next/server';
import { clearAdminCookie } from '@/lib/adminSession';

export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ success: true });
  clearAdminCookie(res);
  return res;
}

