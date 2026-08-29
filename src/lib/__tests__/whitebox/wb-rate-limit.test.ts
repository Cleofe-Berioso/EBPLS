import { afterEach, describe, expect, it } from "vitest";
import {
  checkRateLimit,
  resetRateLimitStoreForTests,
  REGISTER_RATE_LIMIT,
  LOGIN_IP_RATE_LIMIT,
  OTP_REQUEST_IP_RATE_LIMIT,
  OTP_VERIFY_IP_RATE_LIMIT,
  rateLimitResponse,
} from "@/lib/rate-limit";

describe("WB-RATE — rate limit", () => {
  afterEach(() => {
    resetRateLimitStoreForTests();
  });

  it("WB-RATE-01 allows under limit and decrements remaining", () => {
    const cfg = { limit: 3, windowMs: 60_000 };
    const a = checkRateLimit("k1", cfg);
    expect(a.ok).toBe(true);
    if (a.ok) expect(a.remaining).toBe(2);
    const b = checkRateLimit("k1", cfg);
    expect(b.ok).toBe(true);
    if (b.ok) expect(b.remaining).toBe(1);
  });

  it("WB-RATE-02 blocks at limit", () => {
    const cfg = { limit: 2, windowMs: 60_000 };
    expect(checkRateLimit("k2", cfg).ok).toBe(true);
    expect(checkRateLimit("k2", cfg).ok).toBe(true);
    const blocked = checkRateLimit("k2", cfg);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("WB-RATE-03 config constants match coded windows", () => {
    expect(REGISTER_RATE_LIMIT).toEqual({ limit: 5, windowMs: 3_600_000 });
    expect(LOGIN_IP_RATE_LIMIT).toEqual({ limit: 10, windowMs: 900_000 });
    expect(OTP_REQUEST_IP_RATE_LIMIT.limit).toBe(3);
    expect(OTP_VERIFY_IP_RATE_LIMIT.limit).toBe(10);
  });

  it("WB-RATE-04 rateLimitResponse returns 429 with Retry-After", () => {
    const res = rateLimitResponse(Date.now() + 30_000);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });
});
