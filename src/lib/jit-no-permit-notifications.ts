import { isEmailConfigured, sendEmail } from "@/lib/mail";
import {
  buildNoPermitEmailPlainText,
  buildNoPermitEmailSubject,
  buildNoPermitSmsMessage,
  DEFAULT_SUPPORT_EMAIL,
} from "@/lib/jit-no-permit-ticket-copy";
import { isSmsEnabled } from "@/lib/sms-config";
import { sendTransactionalSms } from "@/lib/sms";
import { prisma } from "@/lib/prisma";

export interface NoPermitNotificationInput {
  recordId: string;
  businessName: string;
  personAttended: string;
  ticketNumber: string;
  requiredAction: string;
  contactPhone: string | null;
  contactEmail: string | null;
}

export interface NoPermitNotificationResult {
  status: "SKIPPED" | "SENT" | "FAILED";
  channel: "SMS" | "EMAIL" | "NONE";
  detail?: string;
}

function formatTransactionalSmsDetail(result: {
  ok: boolean;
  provider: "twilio" | "semaphore" | "none";
  providerMessageId?: string;
  reason?: string;
}): string | undefined {
  if (!result.ok) {
    return result.reason;
  }
  if (result.provider === "twilio" && result.providerMessageId) {
    return `Message SID: ${result.providerMessageId}`;
  }
  return "sent";
}

export async function sendNoPermitOptionalNotification(
  input: NoPermitNotificationInput
): Promise<NoPermitNotificationResult> {
  const supportEmail = process.env.SUPPORT_EMAIL?.trim() || DEFAULT_SUPPORT_EMAIL;

  if (!input.contactPhone && !input.contactEmail) {
    await prisma.jitNoPermitRecord.update({
      where: { id: input.recordId },
      data: {
        notificationStatus: "SKIPPED",
        notificationChannel: "NONE",
      },
    });
    return { status: "SKIPPED", channel: "NONE", detail: "NO_CONTACT_INFO" };
  }

  if (input.contactPhone) {
    if (!isSmsEnabled()) {
      await prisma.jitNoPermitRecord.update({
        where: { id: input.recordId },
        data: {
          notificationStatus: "SKIPPED",
          notificationChannel: "SMS",
        },
      });
      return { status: "SKIPPED", channel: "SMS", detail: "SMS_DISABLED" };
    }

    const body = buildNoPermitSmsMessage({
      businessName: input.businessName,
      ticketNumber: input.ticketNumber,
      supportEmail,
    });

    try {
      const result = await sendTransactionalSms(input.contactPhone, body);
      const detail = formatTransactionalSmsDetail(result);
      await prisma.jitNoPermitRecord.update({
        where: { id: input.recordId },
        data: {
          notificationStatus: result.ok ? "SENT" : "FAILED",
          notificationChannel: "SMS",
          notifiedAt: result.ok ? new Date() : null,
        },
      });
      return {
        status: result.ok ? "SENT" : "FAILED",
        channel: "SMS",
        detail,
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown SMS error";
      await prisma.jitNoPermitRecord.update({
        where: { id: input.recordId },
        data: {
          notificationStatus: "FAILED",
          notificationChannel: "SMS",
        },
      });
      return { status: "FAILED", channel: "SMS", detail };
    }
  }

  if (input.contactEmail) {
    if (!isEmailConfigured()) {
      await prisma.jitNoPermitRecord.update({
        where: { id: input.recordId },
        data: {
          notificationStatus: "SKIPPED",
          notificationChannel: "EMAIL",
        },
      });
      return { status: "SKIPPED", channel: "EMAIL", detail: "SMTP_NOT_CONFIGURED" };
    }

    const subject = buildNoPermitEmailSubject(input.ticketNumber);
    const plainText = buildNoPermitEmailPlainText({
      businessName: input.businessName,
      personAttended: input.personAttended,
      ticketNumber: input.ticketNumber,
      requiredAction: input.requiredAction,
      supportEmail,
    });

    try {
      await sendEmail({
        to: input.contactEmail,
        subject,
        html: `<pre style="font-family: sans-serif; white-space: pre-wrap;">${plainText.replace(/</g, "&lt;")}</pre>`,
      });
      await prisma.jitNoPermitRecord.update({
        where: { id: input.recordId },
        data: {
          notificationStatus: "SENT",
          notificationChannel: "EMAIL",
          notifiedAt: new Date(),
        },
      });
      return { status: "SENT", channel: "EMAIL" };
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown email error";
      await prisma.jitNoPermitRecord.update({
        where: { id: input.recordId },
        data: {
          notificationStatus: "FAILED",
          notificationChannel: "EMAIL",
        },
      });
      return { status: "FAILED", channel: "EMAIL", detail };
    }
  }

  return { status: "SKIPPED", channel: "NONE" };
}
