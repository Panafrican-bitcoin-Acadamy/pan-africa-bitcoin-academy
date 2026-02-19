/**
 * Admin Security Utilities
 * Helper functions for admin authentication security features
 */

import crypto from 'crypto';
import { supabaseAdmin } from './supabase';

// Account lockout configuration
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Generate a unique request ID for tracking
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Check if admin account is locked
 */
export async function isAccountLocked(adminId: string): Promise<{ locked: boolean; lockedUntil?: Date }> {
  try {
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('locked_until')
      .eq('id', adminId)
      .maybeSingle();

    if (error || !admin) {
      return { locked: false };
    }

    // If column doesn't exist, admin.locked_until will be undefined
    if (!admin.locked_until) {
      return { locked: false };
    }

    const lockedUntil = new Date(admin.locked_until);
    const now = new Date();

    if (lockedUntil > now) {
      return { locked: true, lockedUntil };
    }

    // Lock expired, clear it
    try {
      await supabaseAdmin
        .from('admins')
        .update({ locked_until: null, failed_login_attempts: 0 })
        .eq('id', adminId);
    } catch (updateError) {
      // Ignore update errors (columns might not exist)
    }

    return { locked: false };
  } catch (error) {
    // If table/columns don't exist, assume account is not locked
    return { locked: false };
  }
}

/**
 * Increment failed login attempts and lock account if threshold reached
 */
export async function handleFailedLogin(adminId: string): Promise<void> {
  try {
    const { data: admin, error: fetchError } = await supabaseAdmin
      .from('admins')
      .select('failed_login_attempts')
      .eq('id', adminId)
      .maybeSingle();

    if (fetchError || !admin) {
      return;
    }

    const newAttempts = (admin.failed_login_attempts || 0) + 1;
    const now = new Date();

    try {
      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        // Lock account
        const lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
        await supabaseAdmin
          .from('admins')
          .update({
            failed_login_attempts: newAttempts,
            locked_until: lockedUntil.toISOString(),
            last_failed_login: now.toISOString(),
          })
          .eq('id', adminId);
      } else {
        // Just increment attempts
        await supabaseAdmin
          .from('admins')
          .update({
            failed_login_attempts: newAttempts,
            last_failed_login: now.toISOString(),
          })
          .eq('id', adminId);
      }
    } catch (updateError) {
      // Ignore update errors (columns might not exist)
      console.warn('[Admin Security] Could not update failed login attempts (migration may not be run):', updateError);
    }
  } catch (error) {
    // Ignore all errors (table/columns might not exist)
    console.warn('[Admin Security] Could not handle failed login (migration may not be run):', error);
  }
}

/**
 * Reset failed login attempts on successful login
 */
export async function resetFailedLoginAttempts(adminId: string): Promise<void> {
  try {
    await supabaseAdmin
      .from('admins')
      .update({
        failed_login_attempts: 0,
        locked_until: null,
        last_failed_login: null,
      })
      .eq('id', adminId);
  } catch (error) {
    // Ignore errors (columns might not exist)
    console.warn('[Admin Security] Could not reset failed login attempts (migration may not be run):', error);
  }
}

/**
 * Log login attempt to database
 */
export async function logLoginAttempt(data: {
  adminId: string | null;
  email: string;
  ipAddress: string;
  userAgent: string | null;
  requestId: string;
  success: boolean;
  failureReason?: string;
}): Promise<void> {
  try {
    await supabaseAdmin
      .from('admin_login_attempts')
      .insert({
        admin_id: data.adminId,
        email: data.email,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        request_id: data.requestId,
        success: data.success,
        failure_reason: data.failureReason || null,
      });
  } catch (error) {
    // Log error but don't fail the login process
    console.error('[Admin Security] Failed to log login attempt:', error);
  }
}

/**
 * Create or update active session record
 */
export async function createActiveSession(data: {
  adminId: string;
  sessionToken: string;
  ipAddress: string;
  userAgent: string | null;
  expiresAt: Date;
}): Promise<void> {
  try {
    // Hash the session token for storage (don't store plain token)
    const hashedToken = crypto
      .createHash('sha256')
      .update(data.sessionToken)
      .digest('hex');

    await supabaseAdmin
      .from('admin_active_sessions')
      .upsert({
        admin_id: data.adminId,
        session_token: hashedToken,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        expires_at: data.expiresAt.toISOString(),
        last_active: new Date().toISOString(),
        revoked: false,
      }, {
        onConflict: 'admin_id,session_token',
      });
  } catch (error) {
    console.error('[Admin Security] Failed to create active session:', error);
  }
}

/**
 * Get user agent from request
 */
export function getUserAgent(req: Request): string | null {
  return req.headers.get('user-agent') || null;
}

