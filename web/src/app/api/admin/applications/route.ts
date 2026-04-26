/**
 * GET /api/admin/applications
 * Paginated + filterable application list for ADMIN users.
 * Supports: ?page, ?limit, ?status, ?type, ?search
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { ApplicationStatus, ApplicationType, Prisma } from "@prisma/client";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10));
    const statusParam = searchParams.get("status");
    const typeParam = searchParams.get("type");
    const search = searchParams.get("search")?.trim();

    const where: Prisma.ApplicationWhereInput = {};

    if (statusParam) {
      where.status = statusParam as ApplicationStatus;
    }
    if (typeParam) {
      where.type = typeParam as ApplicationType;
    }
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: "insensitive" } },
        { applicationNumber: { contains: search, mode: "insensitive" } },
        { applicant: { firstName: { contains: search, mode: "insensitive" } } },
        { applicant: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          applicant: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          documents: { select: { id: true, status: true } },
          permit: { select: { id: true, permitNumber: true, status: true } },
          payments: {
            select: { id: true, status: true, amount: true, method: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    // Serialize Decimal amounts in payments
    const serialized = applications.map((app) => ({
      ...app,
      payments: app.payments.map((p) => ({
        ...p,
        amount: p.amount.toNumber(),
      })),
    }));

    return NextResponse.json({
      applications: serialized,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin applications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
