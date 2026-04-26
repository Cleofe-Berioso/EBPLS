/**
 * Prometheus Metrics Endpoint
 * GET /api/metrics — returns Prometheus-compatible metrics
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPrometheusMetrics } from '@/lib/monitoring';

export async function GET(req: Request) {
  // Only allow authenticated admins or requests with metrics token
  const metricsToken = process.env.METRICS_TOKEN;
  const authHeader = req.headers.get('authorization');

  if (metricsToken && authHeader === `Bearer ${metricsToken}`) {
    // Token auth for Prometheus scraper
    return new Response(getPrometheusMetrics(), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // Session auth for admins
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return new Response(getPrometheusMetrics(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
