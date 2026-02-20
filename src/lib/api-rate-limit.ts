/**
 * API Rate Limiting Helper
 * Provides a reusable function to apply rate limiting to API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, RATE_LIMITS, RateLimitConfig } from './rate-limit';

export interface RateLimitOptions {
  config?: RateLimitConfig;
  identifier?: string; // Custom identifier (defaults to IP)
  skipIfAdmin?: boolean; // Skip rate limiting for admins
}

/**
 * Apply rate limiting to an API route handler
 * Returns a rate limit response if exceeded, or null if allowed
 */
export function applyRateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): NextResponse | null {
  const {
    config = RATE_LIMITS.API,
    identifier,
    skipIfAdmin = false,
  } = options;

  // Skip rate limiting for admins if option is set
  if (skipIfAdmin) {
    // Check if user is admin (you can customize this check)
    const authHeader = req.headers.get('authorization');
    // For now, we'll still apply rate limiting but can be enhanced
  }

  // Get identifier (IP or custom)
  const clientIP = getClientIP(req);
  const rateLimitKey = identifier || `api:${clientIP}`;

  // Check rate limit
  const rateLimit = checkRateLimit(rateLimitKey, config);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  // Add rate limit headers to successful responses
  // This will be handled by the route handler
  return null;
}

/**
 * Rate limit configurations for different endpoint types
 */
export const ENDPOINT_RATE_LIMITS = {
  // Authentication endpoints (login, register, password reset)
  AUTH: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
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
  // File uploads
  UPLOAD: {
    maxRequests: 10,
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
  // Event registration
  EVENT_REGISTRATION: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // General API endpoints (GET requests, data fetching)
  API_READ: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // API write operations (POST, PUT, DELETE)
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

/**
 * Helper to get rate limit config based on endpoint path and method
 */
export function getRateLimitForPath(path: string, method: string = 'GET'): RateLimitConfig {
  // Authentication routes
  if (path.includes('/login') || path.includes('/register') || path.includes('/password') || path.includes('/reset-password')) {
    return ENDPOINT_RATE_LIMITS.AUTH;
  }
  
  // Assignment routes
  if (path.includes('/assignments/submit')) {
    return ENDPOINT_RATE_LIMITS.ASSIGNMENT_SUBMIT;
  }
  
  // Blog routes
  if (path.includes('/blog/submit')) {
    return ENDPOINT_RATE_LIMITS.BLOG_SUBMIT;
  }
  
  // Upload routes
  if (path.includes('/upload') || path.includes('/upload-image') || path.includes('/upload-certificate')) {
    return ENDPOINT_RATE_LIMITS.UPLOAD;
  }
  
  // Exam routes
  if (path.includes('/exam/submit')) {
    return ENDPOINT_RATE_LIMITS.EXAM_SUBMIT;
  }
  
  // Application routes
  if (path.includes('/application') || path.includes('/submit-application') || path.includes('/apply')) {
    return ENDPOINT_RATE_LIMITS.APPLICATION_SUBMIT;
  }
  
  // Event registration routes
  if (path.includes('/events/') && path.includes('/register')) {
    return ENDPOINT_RATE_LIMITS.EVENT_REGISTRATION;
  }
  
  // Admin routes
  if (path.includes('/admin/')) {
    return ENDPOINT_RATE_LIMITS.ADMIN;
  }
  
  // Default based on HTTP method
  if (method === 'GET') {
    return ENDPOINT_RATE_LIMITS.API_READ;
  } else {
    return ENDPOINT_RATE_LIMITS.API_WRITE;
  }
}

