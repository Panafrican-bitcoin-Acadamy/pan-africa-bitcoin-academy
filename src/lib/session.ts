import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Unified session configuration
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes idle timeout (for non-remember me)
const ABSOLUTE_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes absolute lifetime (for non-remember me)
const REMEMBER_ME_IDLE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days idle timeout (for remember me)
const REMEMBER_ME_ABSOLUTE_TIMEOUT_MS = 30 * 24 * 60 * 60 * 1000; // 30 days absolute lifetime (for remember me)
const ADMIN_COOKIE_NAME = 'admin_session';
const STUDENT_COOKIE_NAME = 'student_session';

export type UserType = 'admin' | 'student';

interface SessionPayload {
  userId: string;
  email: string;
  role?: string | null; // For admin
  userType: UserType;
  issuedAt: number;
  lastActive: number;
  rememberMe?: boolean; // Whether "remember me" was checked
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    console.error('ERROR: SESSION_SECRET or ADMIN_SESSION_SECRET is not set in environment variables.');
    console.error('Add this to your .env.local file:');
    console.error('SESSION_SECRET=your-random-secret-here');
    throw new Error('SESSION_SECRET is not set. Check server console for instructions.');
  }
  return secret;
}

function sign(data: string): string {
  const hmac = crypto.createHmac('sha256', getSecret());
  hmac.update(data);
  return hmac.digest('base64url');
}

export function signSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function verifySession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  const expected = sign(body);
  // Timing safe compare
  const isMatch =
    expected.length === sig.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  if (!isMatch) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionPayload;
    const now = Date.now();

    // Use different timeouts based on rememberMe flag
    const idleTimeout = payload.rememberMe ? REMEMBER_ME_IDLE_TIMEOUT_MS : IDLE_TIMEOUT_MS;
    const absoluteTimeout = payload.rememberMe ? REMEMBER_ME_ABSOLUTE_TIMEOUT_MS : ABSOLUTE_TIMEOUT_MS;

    // Enforce idle timeout and absolute lifetime
    if (now - payload.lastActive > idleTimeout) return null;
    if (now - payload.issuedAt > absoluteTimeout) return null;

    return payload;
  } catch (e) {
    return null;
  }
}

function getCookieName(userType: UserType): string {
  return userType === 'admin' ? ADMIN_COOKIE_NAME : STUDENT_COOKIE_NAME;
}

export function setSessionCookie(res: NextResponse, payload: SessionPayload) {
  const token = signSession(payload);
  const cookieName = getCookieName(payload.userType);
  // Use different maxAge based on rememberMe flag
  const maxAge = payload.rememberMe 
    ? Math.floor(REMEMBER_ME_ABSOLUTE_TIMEOUT_MS / 1000)
    : Math.floor(ABSOLUTE_TIMEOUT_MS / 1000);
  // Set secure session cookie with best security practices
  res.cookies.set(cookieName, token, {
    httpOnly: true, // Prevents JavaScript access (XSS protection)
    sameSite: 'lax', // CSRF protection - allows same-site and safe cross-site requests
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    maxAge: maxAge, // Session expiration based on rememberMe preference
    path: '/', // Available site-wide
    // Note: domain is not set to allow subdomain flexibility if needed
  });
}

export function clearSessionCookie(res: NextResponse, userType: UserType) {
  const cookieName = getCookieName(userType);
  // Clear cookie with same security settings
  res.cookies.set(cookieName, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0, // Expire immediately
    path: '/',
  });
}

export function getSession(req: NextRequest, userType: UserType): SessionPayload | null {
  const cookieName = getCookieName(userType);
  const token = req.cookies.get(cookieName)?.value;
  const session = verifySession(token);
  if (!session) return null;

  // Verify user type matches
  if (session.userType !== userType) return null;

  const now = Date.now();
  const refreshed: SessionPayload = {
    ...session,
    lastActive: now,
  };
  return refreshed;
}

export function attachSessionRefresh(res: NextResponse, session: SessionPayload) {
  setSessionCookie(res, session);
}

// Helper functions for admin (backward compatibility)
export function requireAdmin(req: NextRequest) {
  const session = getSession(req, 'admin');
  if (!session) return null;
  return {
    adminId: session.userId,
    email: session.email,
    role: session.role || null,
    issuedAt: session.issuedAt,
    lastActive: session.lastActive,
  };
}

export function setAdminCookie(res: NextResponse, payload: { adminId: string; email: string; role: string | null; issuedAt: number; lastActive: number }) {
  setSessionCookie(res, {
    userId: payload.adminId,
    email: payload.email,
    role: payload.role,
    userType: 'admin',
    issuedAt: payload.issuedAt,
    lastActive: payload.lastActive,
  });
}

export function clearAdminCookie(res: NextResponse) {
  clearSessionCookie(res, 'admin');
}

// Helper functions for student
export function requireStudent(req: NextRequest) {
  const session = getSession(req, 'student');
  if (!session) return null;
  return {
    userId: session.userId,
    email: session.email,
    issuedAt: session.issuedAt,
    lastActive: session.lastActive,
  };
}

export function setStudentCookie(res: NextResponse, payload: { userId: string; email: string; issuedAt: number; lastActive: number; rememberMe?: boolean }) {
  setSessionCookie(res, {
    userId: payload.userId,
    email: payload.email,
    userType: 'student',
    issuedAt: payload.issuedAt,
    lastActive: payload.lastActive,
    rememberMe: payload.rememberMe || false,
  });
}

export function clearStudentCookie(res: NextResponse) {
  clearSessionCookie(res, 'student');
}
