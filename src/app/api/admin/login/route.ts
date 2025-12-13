import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { requireAdmin, setAdminCookie, attachRefresh } from '@/lib/adminSession';
import { validateAndNormalizeEmail, validatePassword } from '@/lib/validation';
import { handleApiError } from '@/lib/api-error-handler';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(`admin-login:${clientIP}`, RATE_LIMITS.AUTH);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many login attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMITS.AUTH.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // If already logged in, refresh session
    const existing = requireAdmin(req);
    if (existing) {
      const res = NextResponse.json({ success: true, admin: existing });
      attachRefresh(res, existing);
      return res;
    }

    const { email, password } = await req.json();

    // Validate email
    const emailValidation = validateAndNormalizeEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error || 'Email is required' },
        { status: 400 }
      );
    }
    const normalizedEmail = emailValidation.normalized!;

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error || 'Password is required' },
        { status: 400 }
      );
    }

    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('id, email, password_hash, role')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error('Database error fetching admin:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!admin) {
      console.error('Admin not found for email:', normalizedEmail);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!admin.password_hash) {
      console.error('Admin has no password hash:', admin.id);
      return NextResponse.json({ error: 'Admin account not properly configured' }, { status: 500 });
    }

    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) {
      console.error('Password mismatch for admin:', admin.id);
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

    const res = NextResponse.json({ success: true, admin: { email: admin.email, role: admin.role } });
    setAdminCookie(res, session);
    return res;
  } catch (error: unknown) {
    console.error('Admin login error:', error);
    const errorResponse = handleApiError(error);
    return NextResponse.json(
      {
        error: errorResponse.message,
        ...(errorResponse.details ? { details: errorResponse.details } : {}),
      },
      { status: errorResponse.status }
    );
  }
}

