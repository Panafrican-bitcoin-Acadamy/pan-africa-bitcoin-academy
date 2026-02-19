import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { requireAdmin, setAdminCookie, attachRefresh } from '@/lib/adminSession';
import { validateAndNormalizeEmail, validatePassword } from '@/lib/validation';
import { handleApiError } from '@/lib/api-error-handler';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';
import {
  generateRequestId,
  isAccountLocked,
  handleFailedLogin,
  resetFailedLoginAttempts,
  logLoginAttempt,
  createActiveSession,
  getUserAgent,
} from '@/lib/admin-security';
import { signSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  // Generate unique request ID for tracking
  const requestId = generateRequestId();
  const clientIP = getClientIP(req);
  const userAgent = getUserAgent(req);

  try {
    // Rate limiting
    const rateLimit = checkRateLimit(`admin-login:${clientIP}`, RATE_LIMITS.AUTH);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many login attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
          requestId, // Include request ID in response
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMITS.AUTH.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            'X-Request-ID': requestId,
          },
        }
      );
    }

    // If already logged in, refresh session
    const existing = requireAdmin(req);
    if (existing) {
      const existingSessionRes = NextResponse.json({ success: true, admin: existing, requestId });
      attachRefresh(existingSessionRes, existing);
      return existingSessionRes;
    }

    // Parse request body with error handling
    let body: { email?: string; password?: string };
    try {
      body = await req.json();
    } catch (parseError) {
      console.error(`[Login ${requestId}] Failed to parse request body:`, parseError);
      return NextResponse.json(
        { error: 'Invalid request format. Please provide email and password.', requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const { email, password } = body;

    // Validate email
    const emailValidation = validateAndNormalizeEmail(email);
    if (!emailValidation.valid) {
      // Log failed attempt (no admin ID yet) - silently fail if table doesn't exist
      logLoginAttempt({
        adminId: null,
        email: email || 'unknown',
        ipAddress: clientIP,
        userAgent,
        requestId,
        success: false,
        failureReason: 'invalid_email_format',
      }).catch(() => {}); // Ignore errors if migration not run

      return NextResponse.json(
        { error: emailValidation.error || 'Email is required', requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }
    const normalizedEmail = emailValidation.normalized!;

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      // Log failed attempt (no admin ID yet) - silently fail if table doesn't exist
      logLoginAttempt({
        adminId: null,
        email: normalizedEmail,
        ipAddress: clientIP,
        userAgent,
        requestId,
        success: false,
        failureReason: 'invalid_password_format',
      }).catch(() => {}); // Ignore errors if migration not run

      return NextResponse.json(
        { error: passwordValidation.error || 'Password is required', requestId },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }
    
    // At this point, password is validated and guaranteed to be a string
    const validatedPassword: string = password!;

    // Fetch admin - try to get security fields, but fallback to basic fields if columns don't exist
    let admin: any = null;
    let queryError: any = null;
    
    try {
      const result = await supabaseAdmin
        .from('admins')
        .select('id, email, password_hash, role, email_verified, locked_until, failed_login_attempts')
        .eq('email', normalizedEmail)
        .maybeSingle();
      admin = result.data;
      // Only treat as error if error exists and has a message/code (not just null)
      if (result.error && (result.error.message || result.error.code)) {
        queryError = result.error;
      }
    } catch (selectError: any) {
      // If columns don't exist, try with basic fields only
      try {
        const result = await supabaseAdmin
          .from('admins')
          .select('id, email, password_hash, role')
          .eq('email', normalizedEmail)
          .maybeSingle();
        admin = result.data;
        // Only treat as error if error exists and has a message/code
        if (result.error && (result.error.message || result.error.code)) {
          queryError = result.error;
        }
      } catch (fallbackError: any) {
        // Only treat as real error if it's a database connection issue
        if (fallbackError?.message || (fallbackError?.code && fallbackError.code !== 'PGRST116')) {
          queryError = fallbackError;
        }
      }
    }

    // Only treat as error if it's a real database error (not just missing columns or null)
    if (queryError && (queryError.message || queryError.code)) {
      console.error(`[Login ${requestId}] Database error fetching admin:`, queryError);
      // Log failed attempt - silently fail if table doesn't exist
      logLoginAttempt({
        adminId: null,
        email: normalizedEmail,
        ipAddress: clientIP,
        userAgent,
        requestId,
        success: false,
        failureReason: 'database_error',
      }).catch(() => {}); // Ignore errors if migration not run

      return NextResponse.json(
        { error: 'Database error', requestId },
        { status: 500, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (!admin) {
      console.error(`[Login ${requestId}] Admin not found for email:`, normalizedEmail);
      // Log failed attempt (admin not found) - silently fail if table doesn't exist
      logLoginAttempt({
        adminId: null,
        email: normalizedEmail,
        ipAddress: clientIP,
        userAgent,
        requestId,
        success: false,
        failureReason: 'admin_not_found',
      }).catch(() => {}); // Ignore errors if migration not run

      return NextResponse.json(
        { error: 'Invalid credentials', requestId },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // Check if account is locked (only if migration has been run)
    let lockStatus: { locked: boolean; lockedUntil?: Date } = { locked: false };
    try {
      lockStatus = await isAccountLocked(admin.id);
    } catch (lockError) {
      // If columns don't exist, assume account is not locked
      console.warn(`[Login ${requestId}] Could not check account lock status (migration may not be run):`, lockError);
    }

    if (lockStatus.locked && lockStatus.lockedUntil) {
      const lockedUntil = lockStatus.lockedUntil;
      const minutesRemaining = Math.ceil((lockedUntil.getTime() - Date.now()) / (60 * 1000));
      
      logLoginAttempt({
        adminId: admin.id,
        email: normalizedEmail,
        ipAddress: clientIP,
        userAgent,
        requestId,
        success: false,
        failureReason: 'account_locked',
      }).catch(() => {}); // Ignore errors if migration not run

      return NextResponse.json(
        {
          error: `Account is locked due to too many failed login attempts. Please try again in ${minutesRemaining} minute(s).`,
          requestId,
          lockedUntil: lockedUntil.toISOString(),
        },
        { status: 423, headers: { 'X-Request-ID': requestId } } // 423 Locked
      );
    }

    if (!admin.password_hash) {
      console.error(`[Login ${requestId}] Admin has no password hash:`, admin.id);
      logLoginAttempt({
        adminId: admin.id,
        email: normalizedEmail,
        ipAddress: clientIP,
        userAgent,
        requestId,
        success: false,
        failureReason: 'no_password_hash',
      }).catch(() => {}); // Ignore errors if migration not run

      return NextResponse.json(
        { error: 'Admin account not properly configured', requestId },
        { status: 500, headers: { 'X-Request-ID': requestId } }
      );
    }

    // Verify password
    const ok = await bcrypt.compare(validatedPassword, admin.password_hash);
    if (!ok) {
      console.error(`[Login ${requestId}] Password mismatch for admin:`, admin.id);
      
      // Handle failed login (increment attempts, lock if needed) - silently fail if migration not run
      handleFailedLogin(admin.id).catch(() => {});
      
      // Log failed attempt - silently fail if table doesn't exist
      logLoginAttempt({
        adminId: admin.id,
        email: normalizedEmail,
        ipAddress: clientIP,
        userAgent,
        requestId,
        success: false,
        failureReason: 'invalid_password',
      }).catch(() => {}); // Ignore errors if migration not run

      return NextResponse.json(
        { error: 'Invalid credentials', requestId },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    // Password is correct - reset failed attempts (silently fail if migration not run)
    resetFailedLoginAttempts(admin.id).catch(() => {});

    // Create session
    const now = Date.now();
    const session = {
      adminId: admin.id,
      email: admin.email,
      role: admin.role || null,
      issuedAt: now,
      lastActive: now,
    };

    try {
      // Sign session token for active session tracking
      const sessionToken = signSession({
        userId: admin.id,
        email: admin.email,
        role: admin.role || null,
        userType: 'admin',
        issuedAt: now,
        lastActive: now,
      });

      // Calculate expiration (8 hours for admin)
      const expiresAt = new Date(now + 8 * 60 * 60 * 1000);

      // Create active session record - silently fail if migration not run
      createActiveSession({
        adminId: admin.id,
        sessionToken,
        ipAddress: clientIP,
        userAgent,
        expiresAt,
      }).catch(() => {}); // Ignore errors if migration not run

      // Log successful login - silently fail if table doesn't exist
      logLoginAttempt({
        adminId: admin.id,
        email: normalizedEmail,
        ipAddress: clientIP,
        userAgent,
        requestId,
        success: true,
      }).catch(() => {}); // Ignore errors if migration not run

      // Check if password change is required (for new admins with temporary passwords)
      // Only check if column exists - gracefully handle if migration not run
      let requiresPasswordChange = false;
      try {
        if (admin.force_password_change === true || (admin.password_changed_at === null && admin.force_password_change !== false)) {
          requiresPasswordChange = true;
        }
      } catch (e) {
        // Columns don't exist, assume password change not required
      }

      const res = NextResponse.json({
        success: true,
        admin: { email: admin.email, role: admin.role },
        requestId,
        requiresPasswordChange, // Indicate if password change is needed
      });
      
      // Set the admin cookie - this is critical for authentication
      // Even if password change is required, set cookie so they can access change password page
      setAdminCookie(res, session);
      res.headers.set('X-Request-ID', requestId);
      
      // Log successful login for debugging
      console.log(`[Login ${requestId}] Login successful for admin:`, {
        adminId: admin.id,
        email: admin.email,
        cookieSet: true,
        requiresPasswordChange,
      });
      
      return res;
    } catch (sessionError: any) {
      console.error(`[Login ${requestId}] Error creating session:`, sessionError);
      // Even if session creation fails, we should still allow login
      // Just log the error but return success with cookie set
      
      // Check if password change is required (for new admins with temporary passwords)
      let requiresPasswordChange = false;
      try {
        if (admin.force_password_change === true || (admin.password_changed_at === null && admin.force_password_change !== false)) {
          requiresPasswordChange = true;
        }
      } catch (e) {
        // Columns don't exist, assume password change not required
      }

      // Still set the cookie even if session tracking failed
      const errorResponse = NextResponse.json({
        success: true,
        admin: { email: admin.email, role: admin.role },
        requestId,
        requiresPasswordChange,
      });
      
      setAdminCookie(errorResponse, session);
      errorResponse.headers.set('X-Request-ID', requestId);
      
      console.log(`[Login ${requestId}] Login successful (with session error):`, {
        adminId: admin.id,
        email: admin.email,
        cookieSet: true,
        sessionError: sessionError?.message,
        requiresPasswordChange,
      });
      
      return errorResponse;
    }
  } catch (error: unknown) {
    console.error(`[Login ${requestId}] Admin login error:`, error);
    
    // Try to log the error attempt if we have email - silently fail if migration not run
    try {
      const body = await req.clone().json().catch(() => ({}));
      const email = (body as any)?.email;
      if (email) {
        logLoginAttempt({
          adminId: null,
          email: typeof email === 'string' ? email : 'unknown',
          ipAddress: clientIP,
          userAgent,
          requestId,
          success: false,
          failureReason: 'server_error',
        }).catch(() => {}); // Ignore errors if migration not run
      }
    } catch (logError) {
      // Ignore logging errors
    }

    const errorResponse = handleApiError(error);
    return NextResponse.json(
      {
        error: errorResponse.message,
        requestId,
        ...(errorResponse.details ? { details: errorResponse.details } : {}),
      },
      {
        status: errorResponse.status,
        headers: { 'X-Request-ID': requestId },
      }
    );
  }
}

