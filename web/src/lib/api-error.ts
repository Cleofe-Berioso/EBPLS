/**
 * Centralized API Error Handler
 * Provides consistent error responses and safe error logging across all API routes.
 */

import { NextResponse } from "next/server";
import { captureException } from "@/lib/monitoring";

export interface ApiErrorOptions {
  /** Route label for monitoring/logging (e.g. "POST /api/applications") */
  route: string;
  /** HTTP status code to return. Defaults to 500. */
  status?: number;
  /** User-facing message. Defaults to "An unexpected error occurred". */
  message?: string;
  /** Additional context passed to captureException */
  context?: Record<string, unknown>;
}

/**
 * Handle an unexpected API error: logs safely, reports to monitoring, returns JSON.
 *
 * Usage:
 *   } catch (error) {
 *     return apiError(error, { route: "POST /api/applications" });
 *   }
 */
export function apiError(
  error: unknown,
  options: ApiErrorOptions
): NextResponse {
  const { route, status = 500, message = "An unexpected error occurred", context } = options;

  const safeMessage = error instanceof Error ? error.message : String(error);
  console.error(`[${route}] ${safeMessage}`);
  captureException(error, { route, ...context });

  return NextResponse.json({ error: message }, { status });
}

/**
 * Return a standard 401 Unauthorized response.
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Return a standard 403 Forbidden response.
 */
export function forbiddenResponse(): NextResponse {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * Return a standard 404 Not Found response.
 */
export function notFoundResponse(entity = "Resource"): NextResponse {
  return NextResponse.json({ error: `${entity} not found` }, { status: 404 });
}

/**
 * Return a standard 400 Bad Request response with validation error message.
 */
export function validationError(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}
