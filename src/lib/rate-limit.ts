import { NextResponse } from "next/server";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

export type RateLimitConfig = {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window length in milliseconds */
  windowMs: number;
};

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; remaining: 0; resetAt: number };

function isE2eRateLimitBypassed(): boolean {
  return process.env.E2E_BLACKBOX === "1";
}

/**
 * Fixed-window in-memory rate limiter.
 * Suitable for single-instance deployments; use Redis/Upstash for multi-instance production.
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  if (isE2eRateLimitBypassed()) {
    const resetAt = Date.now() + config.windowMs;
    return { ok: true, remaining: config.limit, resetAt };
  }

  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { ok: true, remaining: config.limit - 1, resetAt };
  }

  if (existing.count >= config.limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  store.set(key, existing);
  return { ok: true, remaining: config.limit - existing.count, resetAt: existing.resetAt };
}

export function rateLimitResponse(resetAt?: number): NextResponse {
  const retryAfterSec = resetAt
    ? Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
    : 60;

  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
      },
    }
  );
}

/** Clears in-memory rate limit state (for regression scripts/tests). */
export function resetRateLimitStoreForTests(): void {
  store.clear();
}

/** Register: 5 requests per hour per IP */
export const REGISTER_RATE_LIMIT: RateLimitConfig = {
  limit: 5,
  windowMs: 60 * 60 * 1000,
};

/** Credentials login: 10 per 15 minutes per IP */
export const LOGIN_IP_RATE_LIMIT: RateLimitConfig = {
  limit: 10,
  windowMs: 15 * 60 * 1000,
};

/** Credentials login: 10 per 15 minutes per email */
export const LOGIN_EMAIL_RATE_LIMIT: RateLimitConfig = {
  limit: 10,
  windowMs: 15 * 60 * 1000,
};

/** Password reset OTP request: 3 per hour per IP */
export const OTP_REQUEST_IP_RATE_LIMIT: RateLimitConfig = {
  limit: 3,
  windowMs: 60 * 60 * 1000,
};

/** OTP verify: 10 per hour per IP */
export const OTP_VERIFY_IP_RATE_LIMIT: RateLimitConfig = {
  limit: 10,
  windowMs: 60 * 60 * 1000,
};
