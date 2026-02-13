/**
 * Enhanced rate limiting utility with security features
 * 
 * Features:
 * - IP-based rate limiting
 * - Progressive penalties for repeat offenders
 * - IP blocking for persistent violations
 * - Request size limits
 * - Connection throttling
 * 
 * NOTE: For production at scale, consider using Redis-based rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  violations: number; // Track number of times this IP hit rate limit
  blockedUntil?: number; // Timestamp when block expires
}

interface BlockedIP {
  ip: string;
  blockedUntil: number;
  violationCount: number;
  reason: string;
}

// In-memory stores (resets on server restart)
// In production, use Redis for distributed rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();
const blockedIPs = new Map<string, BlockedIP>();

// Security constants
const MAX_VIOLATIONS_BEFORE_BLOCK = 5; // Block after 5 violations
const BLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour block
const PROGRESSIVE_PENALTY_MULTIPLIER = 0.5; // Reduce limit by 50% per violation
const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB max request size
const MAX_CONCURRENT_CONNECTIONS = 20; // Max concurrent connections per IP
const CONNECTION_TIMEOUT_MS = 30 * 1000; // 30 seconds timeout

// Track active connections per IP
const activeConnections = new Map<string, number>();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxRequests: number; // Maximum requests allowed
  windowMs: number; // Time window in milliseconds
}

/**
 * Check if IP is blocked
 */
function isIPBlocked(ip: string): { blocked: boolean; blockedUntil?: number; reason?: string } {
  const blocked = blockedIPs.get(ip);
  if (!blocked) {
    return { blocked: false };
  }

  const now = Date.now();
  if (blocked.blockedUntil > now) {
    return {
      blocked: true,
      blockedUntil: blocked.blockedUntil,
      reason: blocked.reason,
    };
  }

  // Block expired, remove it
  blockedIPs.delete(ip);
  return { blocked: false };
}

/**
 * Block an IP address
 */
function blockIP(ip: string, reason: string): void {
  const existing = blockedIPs.get(ip);
  const violationCount = existing ? existing.violationCount + 1 : 1;
  const blockDuration = violationCount * BLOCK_DURATION_MS; // Progressive blocking

  blockedIPs.set(ip, {
    ip,
    blockedUntil: Date.now() + blockDuration,
    violationCount,
    reason,
  });

  console.warn(`[SECURITY] IP ${ip} blocked for ${blockDuration / 1000}s. Reason: ${reason}. Violations: ${violationCount}`);
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
): { allowed: boolean; remaining: number; resetTime: number; blocked?: boolean; blockReason?: string } {
  const now = Date.now();
  const key = identifier;

  // Extract IP from identifier (format: "path:ip")
  const ip = identifier.includes(':') ? identifier.split(':').slice(-1)[0] : identifier;

  // Check if IP is blocked
  const ipBlockCheck = isIPBlocked(ip);
  if (ipBlockCheck.blocked) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: ipBlockCheck.blockedUntil || now,
      blocked: true,
      blockReason: ipBlockCheck.reason,
    };
  }

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    for (const [k, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
    // Clean up expired blocks
    for (const [k, block] of blockedIPs.entries()) {
      if (block.blockedUntil < now) {
        blockedIPs.delete(k);
      }
    }
  }

  const entry = rateLimitStore.get(key);

  // Apply progressive penalty based on violation history
  let effectiveMaxRequests = config.maxRequests;
  if (entry && entry.violations > 0) {
    const penalty = Math.pow(PROGRESSIVE_PENALTY_MULTIPLIER, entry.violations);
    effectiveMaxRequests = Math.max(1, Math.floor(config.maxRequests * penalty));
  }

  // If no entry or entry expired, create new entry
  if (!entry || entry.resetTime < now) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, {
      count: 1,
      resetTime,
      violations: 0,
    });
    return {
      allowed: true,
      remaining: effectiveMaxRequests - 1,
      resetTime,
    };
  }

  // Entry exists and not expired
  if (entry.count >= effectiveMaxRequests) {
    // Increment violation count
    entry.violations = (entry.violations || 0) + 1;

    // Block IP if too many violations
    if (entry.violations >= MAX_VIOLATIONS_BEFORE_BLOCK) {
      blockIP(ip, `Exceeded rate limit ${entry.violations} times on ${key}`);
    } else {
      // Log violation
      console.warn(`[RATE_LIMIT] IP ${ip} exceeded rate limit on ${key}. Violations: ${entry.violations}`);
    }

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
    remaining: effectiveMaxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Validate IP address format
 */
function isValidIP(ip: string): boolean {
  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 regex (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip === 'unknown';
}

/**
 * Get client IP address from request with enhanced security
 */
export function getClientIP(req: Request | { headers: Headers }): string {
  const headers = req.headers;
  
  // Priority order for IP extraction (most trusted first)
  // 1. Cloudflare connecting IP (most reliable behind proxy)
  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP && isValidIP(cfConnectingIP)) {
    return cfConnectingIP.trim();
  }

  // 2. Real IP header
  const realIP = headers.get('x-real-ip');
  if (realIP && isValidIP(realIP)) {
    return realIP.trim();
  }

  // 3. X-Forwarded-For (take first IP, but be cautious)
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIP = forwarded.split(',')[0].trim();
    if (isValidIP(firstIP)) {
      return firstIP;
    }
  }

  // 4. Other proxy headers
  const headersToCheck = [
    'x-client-ip',
    'x-forwarded',
    'forwarded-for',
    'forwarded',
  ];

  for (const headerName of headersToCheck) {
    const value = headers.get(headerName);
    if (value) {
      const ip = value.split(',')[0].trim();
      if (isValidIP(ip)) {
        return ip;
      }
    }
  }

  // Fallback
  return 'unknown';
}

/**
 * Check request size limits
 */
export function validateRequestSize(contentLength: number | null): { valid: boolean; error?: string } {
  if (contentLength === null) {
    return { valid: true }; // Can't validate without content-length
  }

  if (contentLength > MAX_REQUEST_SIZE) {
    return {
      valid: false,
      error: `Request size exceeds maximum allowed size of ${MAX_REQUEST_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

/**
 * Track and check concurrent connections per IP
 */
export function checkConcurrentConnections(ip: string): { allowed: boolean; active: number; max: number } {
  const current = activeConnections.get(ip) || 0;
  
  if (current >= MAX_CONCURRENT_CONNECTIONS) {
    console.warn(`[SECURITY] IP ${ip} exceeded concurrent connection limit: ${current}/${MAX_CONCURRENT_CONNECTIONS}`);
    return {
      allowed: false,
      active: current,
      max: MAX_CONCURRENT_CONNECTIONS,
    };
  }

  // Increment connection count
  activeConnections.set(ip, current + 1);

  // Auto-decrement after timeout (cleanup)
  setTimeout(() => {
    const count = activeConnections.get(ip) || 0;
    if (count > 0) {
      activeConnections.set(ip, count - 1);
      if (count - 1 === 0) {
        activeConnections.delete(ip);
      }
    }
  }, CONNECTION_TIMEOUT_MS);

  return {
    allowed: true,
    active: current + 1,
    max: MAX_CONCURRENT_CONNECTIONS,
  };
}

/**
 * Release a connection (call when request completes)
 */
export function releaseConnection(ip: string): void {
  const count = activeConnections.get(ip) || 0;
  if (count > 0) {
    activeConnections.set(ip, count - 1);
    if (count - 1 === 0) {
      activeConnections.delete(ip);
    }
  }
}

/**
 * Get rate limit statistics for an IP
 */
export function getRateLimitStats(ip: string): {
  blocked: boolean;
  blockedUntil?: number;
  violations?: number;
  activeConnections?: number;
} {
  const blocked = isIPBlocked(ip);
  const entry = rateLimitStore.get(`*:${ip}`); // Check for any entry with this IP
  const connections = activeConnections.get(ip) || 0;

  return {
    blocked: blocked.blocked,
    blockedUntil: blocked.blockedUntil,
    violations: entry?.violations || 0,
    activeConnections: connections,
  };
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
  // Assignment submission
  ASSIGNMENT_SUBMIT: {
    maxRequests: 20,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // Blog submission
  BLOG_SUBMIT: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Exam submission
  EXAM_SUBMIT: {
    maxRequests: 10,
    windowMs: 30 * 60 * 1000, // 30 minutes
  },
  // Application submission
  APPLICATION_SUBMIT: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // API write operations
  API_WRITE: {
    maxRequests: 50,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // Admin endpoints
  ADMIN: {
    maxRequests: 200,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
} as const;

