import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { cacheOrCompute, CacheKeys, CacheTTL } from "@/lib/cache";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }    const { id } = await params;

    const application = await cacheOrCompute(
      CacheKeys.application(id),
      () =>
        prisma.application.findUnique({
          where: { id },
          include: {
            applicant: {
              select: { firstName: true, lastName: true, email: true },
            },
            documents: { orderBy: { createdAt: "desc" } },
            history: { orderBy: { createdAt: "desc" } },
            reviewActions: {
              orderBy: { createdAt: "desc" },
              include: {
                reviewer: { select: { firstName: true, lastName: true } },
              },
            },
            permit: true,
          },
        }),
      CacheTTL.MEDIUM // 5 min
    );

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Authorization: applicant can only see their own
    if (
      session.user.role === "APPLICANT" &&
      application.applicantId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error("Fetch application error:", error);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}
