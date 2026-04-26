/**
 * POST /api/payments
 * GET /api/payments?id={paymentId}
 * P4.0: Payment Creation & Status
 */

import { NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import type { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { processPayment, generateReceiptNumber } from "@/lib/payments";
import { calculateFees } from "@/lib/payments";
import { rateLimitPayment } from "@/lib/rate-limit";
import { captureException } from "@/lib/monitoring";
import { sendPaymentConfirmationEmail } from "@/lib/email";
import { broadcastPaymentInitiated } from "@/lib/sse";
import { paymentSchema } from "@/lib/validations";
import { toNumber, toDecimalString, serializePayment } from "@/lib/serialization";
import { canCreatePayment, canVerifyPayment } from "@/lib/workflow";


// POST /api/payments - Initiate a payment
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "APPLICANT") {
      return NextResponse.json(
        { error: "Only applicants can initiate payments" },
        { status: 403 }
      );
    }

    // Rate limiting: 5 requests per minute per user
    const rateLimitResult = rateLimitPayment(session.user.id);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again in a minute." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate input
    const validated = paymentSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const { applicationId, method } = validated.data;

    // Get application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { applicant: true, permit: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Verify ownership (APPLICANT can only pay for their own apps)
    if (
      session.user.role === "APPLICANT" &&
      application.applicantId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!canCreatePayment(application.status)) {
      return NextResponse.json(
        {
          error: "Application not ready for payment",
          message: `Application status is ${application.status}. Payment is allowed only after BPLO assessment.`,
        },
        { status: 400 }
      );
    }

    // Calculate fee based on application type and business type (DFD P5.0)
    const feeInfo = calculateFees({
      applicationType: application.type || "NEW",
      businessType: application.businessType || undefined,
      businessName: application.businessName,
      lineOfBusiness: application.lineOfBusiness || undefined,
      grossSales: application.grossSales ? { toDecimal: () => application.grossSales!.toNumber() } : null,
      paymentFrequency: "ANNUAL",
    });

    if (!feeInfo || feeInfo.totalAmount <= 0) {
      return NextResponse.json(
        {
          error: "Fee not configured",
          message: "Unable to calculate application fee",
        },
        { status: 402 }
      );
    }

    // Validate payment method
    const validMethods = ["GCASH", "MAYA", "BANK_TRANSFER", "OTC", "CASH"];
    if (!validMethods.includes(method)) {
      return NextResponse.json(
        {
          error: "Invalid payment method",
          message: `Supported methods: ${validMethods.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Create payment record
    const referenceNumber = generateReceiptNumber();

    // CRITICAL FIX #2: Convert Decimal to number, then wrap in Decimal constructor
    const amountAsNumber = typeof feeInfo.totalAmount === "number"
      ? feeInfo.totalAmount
      : toNumber(feeInfo.totalAmount) || 0;

    const payment = await prisma.payment.create({
      data: {
        applicationId,
        payerId: session.user.id,
        amount: new Decimal(amountAsNumber), // Wrap in Decimal constructor
        method: method as PaymentMethod,
        status: "PENDING",
        referenceNumber,
        metadata: {
          businessName: application.businessName,
          applicationType: application.type,
          businessType: application.businessType,
          permitFee: toDecimalString(feeInfo.permitFee) ?? "0.00",
          processingFee: toDecimalString(feeInfo.processingFee) ?? "0.00",
          filingFee: toDecimalString(feeInfo.filingFee) ?? "0.00",
        } as Prisma.InputJsonValue, // JSON field accepts any serializable value
      },
    });

    await prisma.application.update({
      where: { id: applicationId },
      data: { status: "PAYMENT_PENDING" },
    });

    // Process payment (dispatch to appropriate gateway)
    const paymentResult = await processPayment({
      applicationId,
      amount: amountAsNumber,
      method: method as PaymentMethod,
      description: `Business Permit Application Payment - ${application.applicationNumber}`,
    });

    if (!paymentResult.success) {
      // Update payment to FAILED
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          failedAt: new Date(),
          metadata: {
            ...((payment.metadata as Record<string, unknown>) || {}),
            errorMessage: paymentResult.error,
          } as Prisma.InputJsonValue,
        },
      });

      return NextResponse.json(
        {
          error: "Payment processing failed",
          message: paymentResult.error,
        },
        { status: 503 }
      );
    }

    // Update payment with gateway info
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentResult.status as PaymentStatus,
        transactionId: paymentResult.transactionId || null,
        metadata: {
          ...((payment.metadata as Record<string, unknown>) || {}),
          checkoutUrl: paymentResult.checkoutUrl,
        } as Prisma.InputJsonValue,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "PAYMENT_INITIATED",
        entity: "Payment",
        entityId: payment.id,
        details: {
          applicationId,
          amount: amountAsNumber,
          method,
          referenceNumber,
        },
      },
    });

    // Send confirmation email with properly serialized amount
    await sendPaymentConfirmationEmail(application.applicant.email, {
      businessName: application.businessName,
      amount: amountAsNumber,
      referenceNumber,
      checkoutUrl: paymentResult.checkoutUrl,
    });

    // Broadcast SSE event with properly serialized amount
    await broadcastPaymentInitiated(session.user.id, applicationId, {
      referenceNumber,
      amount: amountAsNumber,
      method,
    });

    return NextResponse.json(
      {
        payment: {
          id: payment.id,
          referenceNumber,
          amount: amountAsNumber,  // NOW a proper number, not {}
          method,
          status: paymentResult.status,
          checkoutUrl: paymentResult.checkoutUrl,
        },
        message: `Payment initiated. Reference: ${referenceNumber}`,
      },
      { status: 201 }
    );
  } catch (error) {
    captureException(error, { route: "POST /api/payments" });
    console.error("Payment creation error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}

// PATCH /api/payments - BPLO_OFFICE verifies or rejects a payment
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "BPLO_OFFICE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { paymentId, action, receiptNumber, notes } = body as {
      paymentId?: string;
      action?: "VERIFY" | "REJECT";
      receiptNumber?: string;
      notes?: string;
    };

    if (!paymentId || !["VERIFY", "REJECT"].includes(action || "")) {
      return NextResponse.json(
        { error: "paymentId and action VERIFY or REJECT are required" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { application: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (!canVerifyPayment(payment.application.status)) {
      return NextResponse.json(
        {
          error: "Payment cannot be verified",
          message: `Application status is ${payment.application.status}.`,
        },
        { status: 409 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (action === "REJECT") {
        const rejectedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "FAILED",
            failedAt: new Date(),
            notes: notes || "Payment rejected by BPLO",
          },
        });

        await tx.activityLog.create({
          data: {
            userId: session.user.id,
            action: "PAYMENT_REJECTED",
            entity: "Payment",
            entityId: payment.id,
            details: { applicationId: payment.applicationId, notes },
          },
        });

        return rejectedPayment;
      }

      const paidPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          receiptNumber: receiptNumber || payment.receiptNumber || generateReceiptNumber(),
          notes: notes || payment.notes,
          metadata: {
            ...((payment.metadata as Record<string, unknown>) || {}),
            verifiedBy: session.user.id,
            verifiedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      await tx.application.update({
        where: { id: payment.applicationId },
        data: {
          status: "PAID",
          paymentConfirmed: true,
          approvedAt: payment.application.approvedAt || new Date(),
        },
      });

      await tx.applicationHistory.create({
        data: {
          applicationId: payment.applicationId,
          previousStatus: payment.application.status,
          newStatus: "PAID",
          comment: "Payment verified by BPLO",
          changedBy: session.user.id,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "PAYMENT_VERIFIED",
          entity: "Payment",
          entityId: payment.id,
          details: { applicationId: payment.applicationId, receiptNumber },
        },
      });

      return paidPayment;
    });

    return NextResponse.json({ payment: serializePayment(updated) });
  } catch (error) {
    captureException(error, { route: "PATCH /api/payments" });
    console.error("Verify payment error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}


// GET /api/payments?id={paymentId}     — single payment details
// GET /api/payments?applicationId={id} — all payments for an application
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("id");
    const applicationId = searchParams.get("applicationId");

    // ── List payments by application ──────────────────────────────────────
    if (applicationId) {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        select: { applicantId: true },
      });

      if (!application) {
        return NextResponse.json({ error: "Application not found" }, { status: 404 });
      }

      // Applicants can only see payments for their own applications
      if (
        session.user.role === "APPLICANT" &&
        application.applicantId !== session.user.id
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const payments = await prisma.payment.findMany({
        where: { applicationId },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        payments: payments.map((p) => serializePayment(p)),
      });
    }

    // ── Single payment by ID ──────────────────────────────────────────────
    if (!paymentId) {
      return NextResponse.json(
        { error: "id or applicationId query param is required" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { application: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Verify access (own payment or staff)
    if (
      session.user.role === "APPLICANT" &&
      payment.application.applicantId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // CRITICAL FIX #2: Serialize payment before returning
    return NextResponse.json({
      payment: serializePayment(payment),
    });
  } catch (error) {
    captureException(error, { route: "GET /api/payments" });
    console.error("Get payment error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "Failed to fetch payment" },
      { status: 500 }
    );
  }
}
