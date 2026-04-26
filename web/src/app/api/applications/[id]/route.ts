import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { cacheOrCompute, CacheKeys, CacheTTL } from "@/lib/cache";
import { canApplicantMutateApplication } from "@/lib/workflow";
import { serializePayment } from "@/lib/serialization";
import { z } from "zod";

const applicationUpdateSchema = z.object({
  type: z.enum(["NEW", "RENEWAL", "CLOSURE"]).optional(),
  businessName: z.string().min(2).max(200).optional(),
  businessTypeCategory: z.enum(["SOLE_PROPRIETORSHIP", "PARTNERSHIP", "CORPORATION", "COOPERATIVE"]).optional(),
  businessType: z.string().min(1).optional(),
  lineOfBusiness: z.string().min(2).max(200).optional(),
  businessAddress: z.string().min(5).optional(),
  businessBarangay: z.string().optional(),
  businessCity: z.string().optional(),
  businessProvince: z.string().optional(),
  businessZipCode: z.string().regex(/^\d{4}$/).optional().or(z.literal("")),
  businessPhone: z.string().optional(),
  businessEmail: z.string().email().optional().or(z.literal("")),
  dtiSecRegistration: z.string().optional(),
  tinNumber: z.string().regex(/^\d{3}-\d{3}-\d{3}-\d{3}$/).optional().or(z.literal("")),
  sssNumber: z.string().optional(),
  businessArea: z.coerce.number().positive().optional(),
  assetValue: z.coerce.number().positive().optional(),
  monthlyRental: z.coerce.number().positive().optional(),
  numberOfEmployees: z.coerce.number().int().positive().optional(),
  capitalInvestment: z.coerce.number().nonnegative().optional(),
  ownerName: z.string().min(2).max(100).optional(),
  ownerBirthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ownerResidenceAddress: z.string().min(5).max(300).optional(),
  ownerPhone: z.string().regex(/^(\+63|0)(9\d{9})$/).optional().or(z.literal("")),
  grossSales: z.coerce.number().nonnegative().optional(),
  previousPermitId: z.string().optional(),
  closureReason: z.string().min(5).optional(),
  closureEffectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

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
            payments: { orderBy: { createdAt: "desc" } },
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

    return NextResponse.json({
      application: {
        ...application,
        payments: application.payments.map((payment) => serializePayment(payment)),
      },
    });
  } catch (error) {
    console.error("Fetch application error:", error);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "APPLICANT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { submit, ...data } = body;

    const application = await prisma.application.findUnique({
      where: { id },
      select: { id: true, applicantId: true, status: true },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    if (application.applicantId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!canApplicantMutateApplication(application.status)) {
      return NextResponse.json(
        { error: `Cannot edit application in ${application.status} status` },
        { status: 409 }
      );
    }

    const validation = applicationUpdateSchema.safeParse(data);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const nextStatus = submit
      ? application.status === "RETURNED_FOR_CORRECTION"
        ? "RESUBMITTED"
        : "SUBMITTED"
      : application.status;

    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id },
        data: {
          ...validation.data,
          status: nextStatus,
          submittedAt: submit ? new Date() : undefined,
          rejectionReason: submit ? null : undefined,
        },
      });

      if (submit) {
        await tx.document.updateMany({
          where: { applicationId: id, status: "UPLOADED" },
          data: { status: "PENDING_VERIFICATION" },
        });
      }

      await tx.applicationHistory.create({
        data: {
          applicationId: id,
          previousStatus: application.status,
          newStatus: nextStatus,
          comment: submit ? "Application submitted by applicant" : "Application draft updated",
          changedBy: session.user.id,
        },
      });

      return app;
    });

    return NextResponse.json({ application: updated });
  } catch (error) {
    console.error("Update application error:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}
