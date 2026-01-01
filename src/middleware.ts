import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { ENDPOINT_RATE_LIMITS, getRateLimitForPath } from '@/lib/api-rate-limit';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply rate limiting to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip rate limiting for certain paths (if needed)
  // For example, health checks or monitoring endpoints
  if (pathname === '/api/health' || pathname === '/api/status') {
    return NextResponse.next();
  }

  // Get rate limit config based on endpoint path and method
  const method = request.method;
  const config = getRateLimitForPath(pathname, method);
  
  // Get client IP
  const clientIP = getClientIP(request);
  
  // Create unique identifier for this endpoint + IP
  const identifier = `${pathname}:${clientIP}`;
  
  // Check rate limit
  const rateLimit = checkRateLimit(identifier, config);

  // If rate limit exceeded, return 429 response
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

  // Create response and add rate limit headers
  const response = NextResponse.next();
  
  // Add rate limit headers to successful responses
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());

  return response;
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all API routes only
     * Excludes:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico and other static assets
     * - Public folder files
     */
    '/api/:path*',
  ],
};

