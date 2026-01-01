# Rate Limiting Implementation - PanAfrican Bitcoin Academy

**Date:** January 2025  
**Status:** ✅ **COMPLETE - All API Routes Protected**

---

## Overview

Comprehensive rate limiting has been implemented across all API endpoints to prevent abuse, DDoS attacks, and ensure fair resource usage.

---

## Implementation Details

### 1. Middleware-Based Rate Limiting

**File:** `src/middleware.ts`

- ✅ Automatically applies to ALL `/api/*` routes
- ✅ No need to modify individual route handlers
- ✅ Centralized configuration
- ✅ Efficient - runs before route handlers

**How it works:**
1. Intercepts all requests to `/api/*` paths
2. Extracts client IP address
3. Determines appropriate rate limit based on endpoint type
4. Checks if request is within limits
5. Returns 429 (Too Many Requests) if exceeded
6. Adds rate limit headers to all responses

### 2. Rate Limit Configurations

**File:** `src/lib/api-rate-limit.ts`

Different endpoint types have different limits:

#### **Authentication Endpoints** (5 requests / 15 minutes)
- `/api/profile/login`
- `/api/profile/register`
- `/api/profile/forgot-password`
- `/api/profile/reset-password`
- `/api/admin/login`

**Rationale:** Prevents brute force attacks on authentication

#### **Assignment Submission** (20 requests / 15 minutes)
- `/api/assignments/submit`

**Rationale:** Allows multiple submissions but prevents spam

#### **Blog Submission** (5 requests / 1 hour)
- `/api/blog/submit`

**Rationale:** Prevents blog spam

#### **File Uploads** (10 requests / 1 hour)
- `/api/profile/upload-image`
- `/api/students/upload-certificate-image`
- `/api/admin/attendance/upload`

**Rationale:** Prevents storage abuse

#### **Exam Submission** (10 requests / 30 minutes)
- `/api/exam/submit`

**Rationale:** Prevents exam manipulation

#### **Application Submission** (5 requests / 1 hour)
- `/api/submit-application`
- `/api/applications/*`

**Rationale:** Prevents application spam

#### **Admin Endpoints** (200 requests / 15 minutes)
- `/api/admin/*`

**Rationale:** Higher limits for admin operations

#### **API Read Operations** (100 requests / 15 minutes)
- All GET requests to `/api/*`

**Rationale:** Allows normal browsing and data fetching

#### **API Write Operations** (50 requests / 15 minutes)
- All POST/PUT/DELETE requests to `/api/*` (except specific endpoints above)

**Rationale:** Prevents write abuse while allowing normal operations

---

## Rate Limit Headers

All API responses include rate limit headers:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: ISO timestamp when limit resets
- `Retry-After`: Seconds until retry is allowed (only on 429 responses)

---

## Rate Limit Response

When rate limit is exceeded, API returns:

```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 123
}
```

**HTTP Status:** 429 (Too Many Requests)

**Headers:**
- `Retry-After`: Seconds until retry
- `X-RateLimit-*`: Rate limit information

---

## Implementation Files

### Core Files:

1. **`src/middleware.ts`**
   - Next.js middleware that intercepts all API requests
   - Applies rate limiting automatically

2. **`src/lib/rate-limit.ts`**
   - Core rate limiting logic
   - In-memory store (resets on server restart)
   - IP address extraction
   - Rate limit checking

3. **`src/lib/api-rate-limit.ts`**
   - Helper functions for API routes
   - Endpoint-specific configurations
   - Path-based rate limit selection

---

## Rate Limiting Strategy

### Identifier Strategy

Rate limits are tracked per:
- **Endpoint path** + **Client IP**
- Example: `/api/assignments/submit:192.168.1.1`

This means:
- Each endpoint has separate limits per IP
- Same IP can hit different endpoints with different limits
- Prevents one endpoint from affecting others

### Storage

- **Current:** In-memory Map (resets on server restart
- **Pros:** Simple, fast, no dependencies
- **Cons:** Resets on restart, not shared across instances

### Production Recommendations

For production at scale, consider:

1. **Redis-based rate limiting:**
   - Shared across server instances
   - Persistent across restarts
   - Better for distributed systems

2. **Upstash Redis** (serverless-friendly):
   ```typescript
   import { Ratelimit } from "@upstash/ratelimit";
   import { Redis } from "@upstash/redis";
   ```

3. **Vercel Edge Config** (if using Vercel)

---

## Testing Rate Limits

### Test Rate Limiting:

1. **Using curl:**
   ```bash
   # Make multiple rapid requests
   for i in {1..10}; do
     curl http://localhost:3000/api/profile/login \
       -X POST \
       -H "Content-Type: application/json" \
       -d '{"email":"test@example.com","password":"test"}'
   done
   ```

2. **Check headers:**
   ```bash
   curl -I http://localhost:3000/api/assignments
   # Look for X-RateLimit-* headers
   ```

3. **Exceed limit:**
   - Make requests faster than the limit
   - Should receive 429 response
   - Check `Retry-After` header

---

## Monitoring

### Recommended Monitoring:

1. **Log 429 responses:**
   - Track which IPs are hitting limits
   - Identify potential attacks
   - Adjust limits if needed

2. **Metrics to track:**
   - Number of 429 responses per endpoint
   - Top IPs hitting rate limits
   - Average requests per IP

3. **Alerts:**
   - Alert if 429 rate exceeds threshold
   - Alert if specific IP hits limits repeatedly

---

## Configuration

### Adjusting Rate Limits

Edit `src/lib/api-rate-limit.ts`:

```typescript
export const ENDPOINT_RATE_LIMITS = {
  AUTH: {
    maxRequests: 5,        // Change this
    windowMs: 15 * 60 * 1000, // Change this
  },
  // ... other limits
};
```

### Adding New Endpoint Types

1. Add to `ENDPOINT_RATE_LIMITS` in `src/lib/api-rate-limit.ts`
2. Update `getRateLimitForPath()` function to detect new endpoint type

---

## Bypassing Rate Limits

### Current Implementation:

- **No automatic bypass** for authenticated users
- **No bypass** for admins (they have higher limits instead)

### Future Enhancements:

Consider adding:
- User-based rate limiting (track by user ID instead of IP)
- Higher limits for authenticated users
- Whitelist for trusted IPs
- Admin bypass option

---

## Security Considerations

### IP Spoofing Protection:

- Uses `x-forwarded-for` header (set by proxy/CDN)
- Falls back to `x-real-ip` and `cf-connecting-ip`
- In production, ensure your hosting provider sets these correctly

### Distributed Attacks:

- Current in-memory store doesn't protect against distributed attacks
- Multiple IPs can each hit limits independently
- For production, use Redis-based rate limiting

### Rate Limit Bypass:

- Limits are per endpoint + IP
- Changing IPs can bypass limits
- Consider user-based rate limiting for authenticated endpoints

---

## Performance Impact

### Overhead:

- **Minimal:** Rate limit check is very fast
- **Memory:** In-memory store grows with unique IPs
- **Cleanup:** Automatic cleanup of expired entries (1% chance per request)

### Optimization:

- Rate limit check happens before route handler
- Failed requests don't execute route logic
- Reduces server load from abusive requests

---

## Status

✅ **All API routes are now rate limited**

**Coverage:**
- ✅ Authentication endpoints
- ✅ Assignment endpoints
- ✅ Blog endpoints
- ✅ Upload endpoints
- ✅ Exam endpoints
- ✅ Application endpoints
- ✅ Admin endpoints
- ✅ General API endpoints

**Last Updated:** January 2025  
**Next Review:** April 2025

---

## Future Improvements

1. [ ] Implement Redis-based rate limiting for production
2. [ ] Add user-based rate limiting for authenticated endpoints
3. [ ] Add rate limit monitoring dashboard
4. [ ] Implement rate limit bypass for trusted IPs
5. [ ] Add rate limit analytics



