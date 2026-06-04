import { handlers } from "@/lib/auth";
import {
  checkRateLimit,
  rateLimitResponse,
  LOGIN_IP_RATE_LIMIT,
} from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-client-ip";
import type { NextRequest } from "next/server";

export const { GET } = handlers;

export async function POST(req: NextRequest) {
  const ipLimit = checkRateLimit(`login:ip:${getClientIp(req)}`, LOGIN_IP_RATE_LIMIT);
  if (!ipLimit.ok) {
    return rateLimitResponse(ipLimit.resetAt);
  }

  return handlers.POST(req);
}
