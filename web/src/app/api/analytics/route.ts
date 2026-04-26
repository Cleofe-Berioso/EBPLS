/**
 * Analytics Dashboard API
 * Processing time metrics, user trends, peak hours, revenue tracking
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { cacheOrCompute, CacheKeys, CacheTTL } from '@/lib/cache';

const APPROVED_STATUSES = new Set([
  'PAYMENT_PENDING',
  'PAID',
  'PERMIT_PREPARED',
  'READY_FOR_RELEASE',
  'RELEASED',
  'COMPLETED',
]);

const PENDING_STATUSES = new Set([
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'RESUBMITTED',
  'ASSESSED',
]);

const RETURNED_STATUSES = new Set([
  'RETURNED_FOR_CORRECTION',
  'REJECTED',
  'CANCELLED',
]);

function buildMonthlySeries(
  rows: { month: Date | string; count: bigint }[],
  months = 12
) {
  const monthFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  });
  const now = new Date();
  const monthStarts = Array.from({ length: months }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - index - 1), 1));
    return {
      key: date.toISOString().slice(0, 7),
      label: monthFormatter.format(date),
    };
  });

  const counts = new Map(
    rows.map((row) => {
      const month = new Date(row.month);
      return [month.toISOString().slice(0, 7), Number(row.count)] as const;
    })
  );

  return monthStarts.map((month) => ({
    month: month.label,
    count: counts.get(month.key) ?? 0,
  }));
}

function buildStatusDistribution(
  applicationStatusRows: { status: string; _count: { status: number } }[]
) {
  const summary = {
    approved: 0,
    pending: 0,
    returned: 0,
  };

  for (const row of applicationStatusRows) {
    if (APPROVED_STATUSES.has(row.status)) {
      summary.approved += row._count.status;
      continue;
    }

    if (PENDING_STATUSES.has(row.status)) {
      summary.pending += row._count.status;
      continue;
    }

    if (RETURNED_STATUSES.has(row.status)) {
      summary.returned += row._count.status;
    }
  }

  return [
    { label: 'Approved', count: summary.approved },
    { label: 'Pending', count: summary.pending },
    { label: 'Returned', count: summary.returned },
  ];
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const daysAgo = parseInt(period);
    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const monthlyStartDate = new Date();
    monthlyStartDate.setUTCMonth(monthlyStartDate.getUTCMonth() - 11, 1);
    monthlyStartDate.setUTCHours(0, 0, 0, 0);

    // Cache key varies by period; analytics are expensive — use 15 min TTL
    const cacheKey = `${CacheKeys.analytics()}:${period}d`;

    const analytics = await cacheOrCompute(
      cacheKey,
      async () => {
    // Run all analytics queries in parallel
    const [
      totalApplications,
      applicationsByStatus,
      applicationsByType,
      recentApplications,
      totalUsers,
      usersByRole,
      newUsersThisPeriod,
      totalPermits,
      activePermits,
      expiringPermits,
      processingTimes,
      dailyApplicationCounts,
      monthlyApplicationCounts,
      activityByHour,
    ] = await Promise.all([
      // Total applications
      prisma.application.count(),

      // Applications by status
      prisma.application.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Applications by type
      prisma.application.groupBy({
        by: ['type'],
        _count: { type: true },
      }),

      // Recent applications (last N days)
      prisma.application.count({
        where: { createdAt: { gte: startDate } },
      }),

      // Total users
      prisma.user.count(),

      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),

      // New users in period
      prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),

      // Total permits
      prisma.permit.count(),

      // Active permits
      prisma.permit.count({
        where: { status: 'ACTIVE' },
      }),

      // Expiring permits (within 30 days)
      prisma.permit.count({
        where: {
          status: 'ACTIVE',
          expiryDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            gte: new Date(),
          },
        },
      }),

      // Average processing time (submitted to approved)
      prisma.$queryRawUnsafe<{ avg_hours: number }[]>(`
        SELECT AVG(EXTRACT(EPOCH FROM ("approvedAt" - "submittedAt")) / 3600) as avg_hours
        FROM applications
        WHERE "approvedAt" IS NOT NULL AND "submittedAt" IS NOT NULL
        AND "submittedAt" >= $1
      `, startDate),

      // Daily application counts for the period
      prisma.$queryRawUnsafe<{ date: string; count: bigint }[]>(`
        SELECT DATE("createdAt") as date, COUNT(*) as count
        FROM applications
        WHERE "createdAt" >= $1
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `, startDate),

      prisma.$queryRawUnsafe<{ month: Date | string; count: bigint }[]>(`
        SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*) as count
        FROM applications
        WHERE "createdAt" >= $1
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month ASC
      `, monthlyStartDate),

      // Activity by hour of day
      prisma.$queryRawUnsafe<{ hour: number; count: bigint }[]>(`
        SELECT EXTRACT(HOUR FROM "createdAt") as hour, COUNT(*) as count
        FROM activity_logs
        WHERE "createdAt" >= $1
        GROUP BY EXTRACT(HOUR FROM "createdAt")
        ORDER BY hour ASC
      `, startDate),    ]);

    // Calculate approval rate
    const approvedCount = applicationsByStatus
      .filter((s) => ['PAYMENT_PENDING', 'PAID', 'PERMIT_PREPARED', 'READY_FOR_RELEASE', 'RELEASED', 'COMPLETED'].includes(s.status))
      .reduce((sum, s) => sum + s._count.status, 0);
    const rejectedCount = applicationsByStatus.find((s) => s.status === 'REJECTED')?._count.status || 0;
    const decidedCount = approvedCount + rejectedCount;
    const approvalRate = decidedCount > 0 ? ((approvedCount / decidedCount) * 100).toFixed(1) : '0';

    return {
      period: `${daysAgo} days`,
      generatedAt: new Date().toISOString(),

      overview: {
        totalApplications,
        recentApplications,
        totalUsers,
        newUsersThisPeriod,
        totalPermits,
        activePermits,
        expiringPermits,
        approvalRate: `${approvalRate}%`,
      },

      applications: {
        byStatus: applicationsByStatus.map((s) => ({
          status: s.status,
          count: s._count.status,
        })),
        byType: applicationsByType.map((t) => ({
          type: t.type,
          count: t._count.type,
        })),
      },

      users: {
        total: totalUsers,
        byRole: usersByRole.map((r) => ({
          role: r.role,
          count: r._count.role,
        })),
        newInPeriod: newUsersThisPeriod,
      },

      performance: {
        averageProcessingTimeHours: processingTimes[0]?.avg_hours
          ? Math.round(processingTimes[0].avg_hours * 10) / 10
          : null,
      },

      trends: {
        dailyApplications: dailyApplicationCounts.map((d) => ({
          date: d.date,
          count: Number(d.count),
        })),
        monthlyApplications: buildMonthlySeries(monthlyApplicationCounts),
        peakHours: activityByHour.map((h) => ({
          hour: Number(h.hour),
          count: Number(h.count),
        })),
      },

      summaries: {
        statusDistribution: buildStatusDistribution(applicationsByStatus),
      },
    };
      }, // end cacheOrCompute compute fn
      CacheTTL.VERY_LONG // 30 min
    );

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to generate analytics' }, { status: 500 });
  }
}
