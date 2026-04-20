/**
 * Cron Job: Expire Temporary Schedule Holds
 * DEPRECATED: Removed with claim scheduling system in 3-role refactoring
 * Kept as no-op for backwards compatibility with Vercel Cron
 *
 * Invoke via:
 *   - Vercel Cron: every 5 minutes via GET /api/cron/expire-holds
 *   - node-cron in instrumentation.ts
 *   - Manual: curl -H "x-cron-secret: $CRON_SECRET" /api/cron/expire-holds
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Protect with a shared secret (set CRON_SECRET in .env)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("x-cron-secret");
    if (authHeader !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const now = new Date();

    logger.info("[cron/expire-holds] Cron called but feature disabled (claim scheduling removed)");

    // No-op: claim scheduling system has been removed
    return NextResponse.json({
      expired: 0,
      message: "Cron job disabled (claim scheduling feature removed)",
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logger.error("[cron/expire-holds] Error:", error);
    return NextResponse.json({ error: "Failed to expire holds" }, { status: 500 });
  }
}
