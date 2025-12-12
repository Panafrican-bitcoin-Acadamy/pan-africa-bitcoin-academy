import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { attachRefresh, requireAdmin, setAdminCookie, clearAdminCookie } from '@/lib/adminSession';

export async function POST(req: NextRequest) {
  try {
    // If already logged in, refresh session
    const existing = requireAdmin(req);
    if (existing) {
      const res = NextResponse.json({ success: true, admin: existing });
      attachRefresh(res, existing);
      return res;
    }

    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('id, email, password_hash, role')
      .ilike('email', email)
      .maybeSingle();

    if (error || !admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, admin.password_hash || '');
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const now = Date.now();
    const session = {
      adminId: admin.id,
      email: admin.email,
      role: admin.role || null,
      issuedAt: now,
      lastActive: now,
    };

    const res = NextResponse.json({ success: true, admin: session });
    setAdminCookie(res, session);
    return res;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

