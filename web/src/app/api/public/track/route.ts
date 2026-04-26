import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { captureException } from "@/lib/monitoring";
import { getClientIp, rateLimitAPI, rateLimitHeaders } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const rateLimitResult = rateLimitAPI(`public-track:${getClientIp(request)}`);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) }
      );
    }

    const { searchParams } = new URL(request.url);
    const ref = searchParams.get("number")?.trim().toUpperCase();
    const verifier = searchParams.get("email")?.trim().toLowerCase()
      || searchParams.get("phone")?.trim();

    if (!ref) {
      return NextResponse.json({ error: "Application number is required" }, { status: 400 });
    }

    if (!verifier) {
      return NextResponse.json(
        { error: "Email address or phone number is required to look up an application" },
        { status: 400 }
      );
    }

    const application = await prisma.application.findFirst({
      where: { applicationNumber: ref },
      select: {
        applicationNumber: true,
        businessName: true,
        type: true,
        status: true,
        createdAt: true,
        approvedAt: true,
        rejectedAt: true,
        applicant: {
          select: { email: true, phone: true },
        },
        history: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { newStatus: true, createdAt: true, comment: true },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Verify the requester owns the application (compare email or phone)
    const emailMatch = application.applicant.email?.toLowerCase() === verifier;
    const phoneMatch = application.applicant.phone?.replace(/\D/g, "") === verifier.replace(/\D/g, "");
    if (!emailMatch && !phoneMatch) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Strip applicant PII before returning
    const { applicant: _applicant, ...safeApplication } = application;
    return NextResponse.json({ application: safeApplication });
  } catch (error) {
    captureException(error, { route: "GET /api/public/track" });
    console.error("Error tracking application:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "Failed to track application" },
      { status: 500 }
    );
  }
}

