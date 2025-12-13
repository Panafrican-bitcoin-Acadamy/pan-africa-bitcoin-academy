import { NextRequest, NextResponse } from 'next/server';
import { clearStudentCookie } from '@/lib/session';

export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ success: true });
  clearStudentCookie(res);
  return res;
}
