import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes idle timeout
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours absolute limit
const COOKIE_NAME = 'admin_session';

interface AdminSessionPayload {
  adminId: string;
  email: string;
  role: string | null;
  issuedAt: number;
  lastActive: number;
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is not set');
  }
  return secret;
}

function sign(data: string): string {
  const hmac = crypto.createHmac('sha256', getSecret());
  hmac.update(data);
  return hmac.digest('base64url');
}

export function signSession(payload: AdminSessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function verifySession(token: string | undefined): AdminSessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  const expected = sign(body);
  // Timing safe compare
  const isMatch =
    expected.length === sig.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  if (!isMatch) return null;

  const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as AdminSessionPayload;
  const now = Date.now();

  if (now - payload.issuedAt > MAX_AGE_MS) return null;
  if (now - payload.lastActive > IDLE_TIMEOUT_MS) return null;

  return payload;
}

export function setAdminCookie(res: NextResponse, payload: AdminSessionPayload) {
  const token = signSession(payload);
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: Math.floor(MAX_AGE_MS / 1000),
    path: '/',
  });
}

export function clearAdminCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, '', { httpOnly: true, maxAge: 0, path: '/' });
}

export function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = verifySession(token);
  if (!session) return null;

  const now = Date.now();
  const refreshed: AdminSessionPayload = {
    ...session,
    lastActive: now,
  };
  return refreshed;
}

export function attachRefresh(res: NextResponse, session: AdminSessionPayload) {
  setAdminCookie(res, session);
}

