import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/adminSession';

// Debug endpoint to check admin account status
// Only accessible in development or by authenticated admins
export async function GET(req: NextRequest) {
  // Block in production unless admin is authenticated
  if (process.env.NODE_ENV === 'production') {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  }
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('id, email, role, created_at, password_hash')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ 
        error: 'Database error',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      }, { status: 500 });
    }

    if (!admin) {
      return NextResponse.json({ 
        found: false,
        message: 'Admin not found',
        searchedEmail: normalizedEmail
      }, { status: 200 });
    }

    // Don't return any password hash information
    return NextResponse.json({
      found: true,
      id: admin.id,
      email: admin.email,
      role: admin.role,
      created_at: admin.created_at,
      hasPasswordHash: !!admin.password_hash,
      }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal error',
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
    }, { status: 500 });
  }
}

// Test password endpoint - only in development
export async function POST(req: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    const session = requireAdmin(req);
    if (!session) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  }
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email and password required' 
      }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('id, email, password_hash')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error || !admin) {
      return NextResponse.json({ 
        found: false,
        error: 'Admin not found',
        searchedEmail: normalizedEmail
      }, { status: 200 });
    }

    if (!admin.password_hash) {
      return NextResponse.json({ 
        found: true,
        hasPassword: false,
        error: 'Admin has no password hash'
      }, { status: 200 });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password_hash);

    return NextResponse.json({
      found: true,
      hasPassword: true,
      passwordMatch: passwordMatch,
      adminId: admin.id,
      email: admin.email,
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal error',
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
    }, { status: 500 });
  }
}
