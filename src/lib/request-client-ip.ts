import type { NextRequest } from "next/server";

/**
 * Resolve client IP behind reverse proxies (Vercel, nginx, etc.).
 */
export function getClientIp(req: NextRequest | Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}
