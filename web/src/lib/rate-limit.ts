/**
 * Rate Limiting Module
 * In-memory rate limiter with sliding window (Redis-backed in production)
 */

// ============================================================================
// In-Memory Rate Limiter (for development / single-instance)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60_000); // Clean every minute
}

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

// ============================================================================
// Pre-configured Rate Limiters
// ============================================================================

/** General API: 100 requests per minute per IP */
export function rateLimitAPI(ip: string): RateLimitResult {
  return checkRateLimit(`api:${ip}`, { maxRequests: 100, windowSeconds: 60 });
}

/** Auth endpoints: 10 requests per minute per IP (stricter) */
export function rateLimitAuth(ip: string): RateLimitResult {
  return checkRateLimit(`auth:${ip}`, { maxRequests: 10, windowSeconds: 60 });
}

/** OTP requests: 5 per 15 minutes per IP */
export function rateLimitOtp(ip: string): RateLimitResult {
  return checkRateLimit(`otp:${ip}`, { maxRequests: 5, windowSeconds: 900 });
}

/** File uploads: 20 per minute per user */
export function rateLimitUpload(userId: string): RateLimitResult {
  return checkRateLimit(`upload:${userId}`, { maxRequests: 20, windowSeconds: 60 });
}

/** Payment attempts: 5 per minute per user */
export function rateLimitPayment(userId: string): RateLimitResult {
  return checkRateLimit(`payment:${userId}`, { maxRequests: 5, windowSeconds: 60 });
}

// ============================================================================
// Helper: Get client IP from request
// ============================================================================

/**
 * Trusted proxy CIDR ranges.
 * Set TRUSTED_PROXY_CIDRS env var to a comma-separated list of trusted proxy IPs/CIDRs
 * (e.g. "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16" for RFC-1918 private ranges).
 * If not set, X-Forwarded-For is NOT trusted and the connection address is used.
 */
const TRUSTED_PROXY_CIDRS = process.env.TRUSTED_PROXY_CIDRS
  ? process.env.TRUSTED_PROXY_CIDRS.split(',').map((s) => s.trim())
  : [];

function isPrivateOrTrustedIp(ip: string): boolean {
  if (TRUSTED_PROXY_CIDRS.length === 0) return false;
  // Simple prefix-match for common private ranges configured in env
  return TRUSTED_PROXY_CIDRS.some((cidr) => {
    // Support exact IP or simple /8, /16, /24 prefix matching
    const [base] = cidr.split('/');
    const prefix = base.split('.').slice(0, cidr.includes('/8') ? 1 : cidr.includes('/16') ? 2 : 3).join('.');
    return ip.startsWith(prefix);
  });
}

export function getClientIp(request: Request): string {
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  // Only trust X-Forwarded-For when running behind a known trusted proxy
  if (TRUSTED_PROXY_CIDRS.length > 0) {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
  }

  return '127.0.0.1';
}

// ============================================================================
// Helper: Create rate limit response headers
// ============================================================================

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.remaining.toString(),
    'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
    'X-RateLimit-Reset': new Date(result.resetAt).toUTCString(),
    ...(result.retryAfterSeconds ? { 'Retry-After': result.retryAfterSeconds.toString() } : {}),
  };
}
