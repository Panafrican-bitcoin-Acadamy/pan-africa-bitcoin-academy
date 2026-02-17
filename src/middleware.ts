import { NextRequest, NextResponse } from 'next/server';
import { 
  checkRateLimit, 
  getClientIP, 
  validateRequestSize, 
  checkConcurrentConnections,
  releaseConnection 
} from '@/lib/rate-limit';
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

  // Get client IP
  const clientIP = getClientIP(request);

  // Security: Check request size
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const sizeCheck = validateRequestSize(parseInt(contentLength, 10));
    if (!sizeCheck.valid) {
      return NextResponse.json(
        { error: sizeCheck.error || 'Request too large' },
        { status: 413 } // Payload Too Large
      );
    }
  }

  // Security: Check concurrent connections per IP
  // Skip for admin routes (they may need more concurrent connections)
  const isAdminRoute = pathname.startsWith('/api/admin/');
  let connectionCheck = { allowed: true, active: 0, max: 20 };
  
  if (!isAdminRoute) {
    connectionCheck = checkConcurrentConnections(clientIP);
    if (!connectionCheck.allowed) {
      console.warn(`[SECURITY] IP ${clientIP} exceeded concurrent connection limit`);
      return NextResponse.json(
        {
          error: 'Too many concurrent connections. Please try again later.',
          retryAfter: 60,
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
          },
        }
      );
    }
  }

  // Get rate limit config based on endpoint path and method
  const method = request.method;
  const config = getRateLimitForPath(pathname, method);
  
  // Create unique identifier for this endpoint + IP
  const identifier = `${pathname}:${clientIP}`;
  
  // Check rate limit
  const rateLimit = checkRateLimit(identifier, config);

  // If IP is blocked, return 403 Forbidden
  if (rateLimit.blocked) {
    releaseConnection(clientIP); // Release connection
    return NextResponse.json(
      {
        error: 'Access denied. Your IP has been temporarily blocked due to repeated violations.',
        blockReason: rateLimit.blockReason,
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
      },
      {
        status: 403, // Forbidden
        headers: {
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  // If rate limit exceeded, return 429 response
  if (!rateLimit.allowed) {
    releaseConnection(clientIP); // Release connection
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
  response.headers.set('X-Concurrent-Connections', connectionCheck.active.toString());
  response.headers.set('X-Max-Concurrent-Connections', connectionCheck.max.toString());

  // Release connection when response is sent (using AbortController)
  // Note: In Next.js middleware, we can't easily track response completion
  // This is a limitation - connections will auto-release after timeout

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

