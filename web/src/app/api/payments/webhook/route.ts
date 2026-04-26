import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { verifyPayMongoWebhook } from "@/lib/payments";
import { captureException } from "@/lib/monitoring";

const PAYMONGO_WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET || "";

interface PayMongoEvent {
  id: string;
  type: string;
  data: {
    id: string;
    attributes: Record<string, unknown>;
  };
}

export async function POST(request: Request) {
  let event: PayMongoEvent | null = null;
  try {
    // Verify webhook signature from PayMongo
    const signature = request.headers.get("x-paymongo-signature") || "";
    const body = await request.text();

    if (!verifyPayMongoWebhook(body, signature)) {
      console.warn("Invalid PayMongo webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    event = JSON.parse(body) as PayMongoEvent;
    const webhookId = event.id;

    let processed = false;

    // Handle payment.succeeded event
    if (event.type === "payment.succeeded") {
      const transactionId = event.data.id;

      // CRITICAL FIX #1: Check if webhook already processed (IDEMPOTENCY)
      const existingWebhook = await prisma.webhookLog.findUnique({
        where: { paymongoWebhookId: webhookId },
      });

      if (existingWebhook?.status === "PROCESSED") {
        // Webhook already handled successfully
        return NextResponse.json(
          { status: "already_processed", webhookId },
          { status: 200 }
        );
      }

      const payment = await prisma.payment.findUnique({
        where: { transactionId },
        include: { application: { include: { applicant: true } } },
      });

      if (!payment) {
        // Log failed webhook for debugging
        await prisma.webhookLog.create({
          data: {
            paymongoWebhookId: webhookId,
            eventType: event.type,
            status: "FAILED",
            errorMessage: "Payment not found",
          },
        });
        return NextResponse.json(
          { error: "Payment not found" },
          { status: 404 }
        );
      }

      if (payment.status === "PENDING") {
        // Process in transaction for atomicity
        const result = await prisma.$transaction(
          async (tx) => {
            // Double-check payment status in transaction
            const paymentInTx = await tx.payment.findUnique({
              where: { id: payment.id },
              select: { status: true, id: true },
            });

            if (paymentInTx?.status !== "PENDING") {
              throw new Error("Payment already processed");
            }

            // Update payment status
            const updatedPayment = await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: "PAID",
                paidAt: new Date(),
                metadata: {
                  ...((payment.metadata as Record<string, unknown>) || {}),
                  paymongoId: event!.data.id,
                  webhookId: webhookId,
                  completedAt: new Date().toISOString(),
                } as Prisma.InputJsonValue,
              },
            });

            if (payment.application.status !== "PAYMENT_PENDING") {
              throw new Error(
                "Application must be PAYMENT_PENDING before payment approval"
              );
            }

            const updatedApp = await tx.application.update({
              where: { id: payment.applicationId },
              data: { status: "PAID", paymentConfirmed: true },
            });

            // Log activity
            await tx.activityLog.create({
              data: {
                userId: payment.application.applicantId,
                action: "PAYMENT_PAID_VIA_WEBHOOK",
                entity: "Payment",
                entityId: payment.id,
                details: {
                  paymentId: payment.id,
                  webhookId: webhookId,
                },
              },
            });

            await tx.applicationHistory.create({
              data: {
                applicationId: payment.applicationId,
                previousStatus: payment.application.status,
                newStatus: "PAID",
                comment: "Payment marked paid by gateway webhook",
                changedBy: payment.application.applicantId,
              },
            });

            return { application: updatedApp, payment: updatedPayment };
          },
          {
            maxWait: 5000,
            timeout: 30000,
          }
        );

        // Record webhook as processed (after transaction succeeds)
        await prisma.webhookLog.create({
          data: {
            paymongoWebhookId: webhookId,
            eventType: event.type,
            status: "PROCESSED",
            result: {
              paymentId: result.payment.id,
              applicationId: result.application.id,
            },
          },
        });

        processed = true;
      }
    }

    // Handle payment.failed event
    if (event.type === "payment.failed") {
      const transactionId = event.data.id;

      const payment = await prisma.payment.findUnique({
        where: { transactionId },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "FAILED",
            failedAt: new Date(),
            metadata: {
              ...((payment.metadata as Record<string, unknown>) || {}),
              failureReason: (event.data.attributes as { failure_message?: string }).failure_message,
              failedAt: new Date().toISOString(),
            } as Prisma.InputJsonValue,
          },
        });

        // Log webhook
        await prisma.webhookLog.create({
          data: {
            paymongoWebhookId: event.id,
            eventType: event.type,
            status: "PROCESSED",
          },
        });

        processed = true;
      }
    }

    // Handle payment.disputed event
    if (event.type === "payment.disputed") {
      const transactionId = event.data.id;

      const payment = await prisma.payment.findUnique({
        where: { transactionId },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "FAILED",
            metadata: {
              ...((payment.metadata as Record<string, unknown>) || {}),
              disputeReason: (event.data.attributes as { dispute_reason?: string }).dispute_reason,
              disputedAt: new Date().toISOString(),
            } as Prisma.InputJsonValue,
          },
        });

        // Log webhook
        await prisma.webhookLog.create({
          data: {
            paymongoWebhookId: event.id,
            eventType: event.type,
            status: "PROCESSED",
          },
        });

        processed = true;
      }
    }

    // Return 200 OK for successful processing
    return NextResponse.json(
      { status: processed ? "processed" : "unhandled" },
      { status: 200 }
    );
  } catch (error) {
    captureException(error, {
      route: "POST /api/payments/webhook",
      webhookId: event?.id,
    });

    console.error("Webhook processing error:", error instanceof Error ? error.message : String(error));

    // Log failed webhook
    try {
      if (event?.id) {
        await prisma.webhookLog.create({
          data: {
            paymongoWebhookId: event.id,
            eventType: event.type ?? "unknown",
            status: "FAILED",
            errorMessage: error instanceof Error ? error.message : String(error),
          },
        });
      }
    } catch (logError) {
      console.error("Failed to log webhook error:", logError instanceof Error ? logError.message : String(logError));
    }

    // Return 202 to prevent infinite retries, but the error is logged
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 202 }
    );
  }
}
