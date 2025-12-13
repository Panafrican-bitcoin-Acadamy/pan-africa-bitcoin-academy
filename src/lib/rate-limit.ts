/**
 * Simple in-memory rate limiting utility
 * 
 * NOTE: This is a basic implementation. For production at scale,
 * consider using Redis-based rate limiting (e.g., Upstash Redis)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (resets on server restart)
// In production, use Redis for distributed rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxRequests: number; // Maximum requests allowed
  windowMs: number; // Time window in milliseconds
}

/**
 * Check if request should be rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Object with `allowed` boolean and `remaining` requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;

  // Clean up expired entries periodically (simple cleanup)
  if (Math.random() < 0.01) {
    // 1% chance to clean up (avoids cleaning on every request)
    for (const [k, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
  }

  const entry = rateLimitStore.get(key);

  // If no entry or entry expired, create new entry
  if (!entry || entry.resetTime < now) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, {
      count: 1,
      resetTime,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  // Entry exists and not expired
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client IP address from request
 */
export function getClientIP(req: Request): string {
  // Try to get IP from headers (Vercel, Cloudflare, etc.)
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback (shouldn't happen in production)
  return 'unknown';
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS = {
  // Authentication endpoints - stricter limits
  AUTH: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // General API endpoints
  API: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // File uploads
  UPLOAD: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
} as const;

