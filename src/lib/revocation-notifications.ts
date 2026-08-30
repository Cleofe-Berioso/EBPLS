import type { RevocationNotificationEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured, sendEmail } from "@/lib/mail";
import {
  buildRevocationEmailPlainText,
  buildRevocationEmailSubject,
  buildRevocationHistoryRemarks,
  buildViolationBasis,
  formatRevocationDateLabel,
  type RevocationNotificationContext,
  resolveRevocationNextAction,
} from "@/lib/revocation-notification-copy";
import { RevocationNotificationDeliveryStatus } from "@prisma/client";

function isRevocationEmailEnabled(): boolean {
  return process.env.REVOCATION_EMAIL_ENABLED?.trim().toLowerCase() === "true";
}

export function buildRevocationContextFromParts(input: {
  applicationId: string;
  applicationNumber: string;
  applicantId: string;
  applicantEmail: string;
  inspectionId: string;
  businessName: string;
  permitNumber: string | null;
  recommendationRemarks: string | null;
  inspectionComment: string | null;
  nonComplianceType?: string | null;
  violationSeverity?: string | null;
  departmentHeadRemarks?: string | null;
  decisionRemarks?: string | null;
  eventDate: Date;
  departmentOfficerLabel: string;
  eventType: RevocationNotificationEventType;
}): RevocationNotificationContext {
  const violationBasis = buildViolationBasis({
    recommendationRemarks: input.recommendationRemarks,
    inspectionComment: input.inspectionComment,
    nonComplianceType: input.nonComplianceType,
    violationSeverity: input.violationSeverity,
    departmentHeadRemarks: input.departmentHeadRemarks,
    decisionRemarks: input.decisionRemarks,
  });

  return {
    applicationId: input.applicationId,
    applicationNumber: input.applicationNumber,
    applicantId: input.applicantId,
    applicantEmail: input.applicantEmail,
    inspectionId: input.inspectionId,
    businessName: input.businessName,
    permitNumber: input.permitNumber,
    violationBasis,
    eventDateLabel: formatRevocationDateLabel(input.eventDate),
    departmentOfficerLabel: input.departmentOfficerLabel,
    nextAction: resolveRevocationNextAction(input.eventType),
    decisionRemarks: input.decisionRemarks ?? null,
  };
}

export async function loadRevocationNotificationContext(
  inspectionId: string,
  eventType: RevocationNotificationEventType,
  options?: {
    departmentHeadRemarks?: string | null;
    decisionRemarks?: string | null;
    eventDate?: Date;
    departmentOfficerLabel?: string | null;
  }
): Promise<RevocationNotificationContext | null> {
  const inspection = await prisma.inspection.findUnique({
    where: { id: inspectionId },
    include: {
      inspector: { select: { name: true } },
      decidedBy: { select: { name: true } },
      application: {
        select: {
          id: true,
          applicationNumber: true,
          applicantId: true,
          applicant: { select: { email: true } },
          permitIssuance: { select: { documentNumber: true } },
        },
      },
      businessRecord: {
        select: {
          businessName: true,
        },
      },
    },
  });

  if (!inspection?.application) return null;

  const eventDate = options?.eventDate ?? new Date();
  const departmentOfficerLabel =
    options?.departmentOfficerLabel?.trim() ||
    inspection.decidedBy?.name ||
    inspection.inspector.name ||
    "Department Head / Joint Inspection Team";

  const violationBasis = buildViolationBasis({
    recommendationRemarks: inspection.revocationRecommendationRemarks ?? inspection.revocationRemarks,
    inspectionComment: inspection.comment,
    nonComplianceType: inspection.nonComplianceType,
    violationSeverity: inspection.violationSeverity,
    departmentHeadRemarks: options?.departmentHeadRemarks,
    decisionRemarks: options?.decisionRemarks,
  });

  return {
    applicationId: inspection.application.id,
    applicationNumber: inspection.application.applicationNumber,
    applicantId: inspection.application.applicantId,
    applicantEmail: inspection.application.applicant.email,
    inspectionId: inspection.id,
    businessName: inspection.businessRecord.businessName,
    permitNumber: inspection.application.permitIssuance?.documentNumber ?? null,
    violationBasis,
    eventDateLabel: formatRevocationDateLabel(eventDate),
    departmentOfficerLabel,
    nextAction: resolveRevocationNextAction(eventType),
    decisionRemarks: options?.decisionRemarks ?? null,
  };
}

export function buildRevocationHistoryRemarksForEvent(
  eventType: RevocationNotificationEventType,
  context: RevocationNotificationContext
): string {
  return buildRevocationHistoryRemarks(eventType, context);
}

export async function sendRevocationEmailNotification(
  context: RevocationNotificationContext,
  eventType: RevocationNotificationEventType
): Promise<{ status: "SKIPPED" | "SENT" | "FAILED"; reason?: string }> {
  const subject = buildRevocationEmailSubject(eventType, context.applicationNumber);
  const plainText = buildRevocationEmailPlainText(eventType, context);
  const html = `<pre style="font-family: sans-serif; white-space: pre-wrap;">${plainText.replace(/</g, "&lt;")}</pre>`;

  if (!isRevocationEmailEnabled()) {
    await prisma.revocationNotificationLog.create({
      data: {
        applicationId: context.applicationId,
        applicantId: context.applicantId,
        inspectionId: context.inspectionId,
        eventType,
        recipientEmail: context.applicantEmail,
        status: RevocationNotificationDeliveryStatus.SKIPPED,
        subject,
        messageBody: plainText,
        skipReason: "REVOCATION_EMAIL_DISABLED",
      },
    });
    return { status: "SKIPPED", reason: "REVOCATION_EMAIL_DISABLED" };
  }

  if (!isEmailConfigured()) {
    await prisma.revocationNotificationLog.create({
      data: {
        applicationId: context.applicationId,
        applicantId: context.applicantId,
        inspectionId: context.inspectionId,
        eventType,
        recipientEmail: context.applicantEmail,
        status: RevocationNotificationDeliveryStatus.SKIPPED,
        subject,
        messageBody: plainText,
        skipReason: "SMTP_NOT_CONFIGURED",
      },
    });
    return { status: "SKIPPED", reason: "SMTP_NOT_CONFIGURED" };
  }

  const existing = await prisma.revocationNotificationLog.findUnique({
    where: {
      applicationId_eventType: {
        applicationId: context.applicationId,
        eventType,
      },
    },
  });

  if (existing?.status === RevocationNotificationDeliveryStatus.SENT) {
    return { status: "SKIPPED", reason: "ALREADY_SENT" };
  }

  try {
    const result = await sendEmail({
      to: context.applicantEmail,
      subject,
      html,
      text: plainText,
    });

    await prisma.revocationNotificationLog.upsert({
      where: {
        applicationId_eventType: {
          applicationId: context.applicationId,
          eventType,
        },
      },
      create: {
        applicationId: context.applicationId,
        applicantId: context.applicantId,
        inspectionId: context.inspectionId,
        eventType,
        recipientEmail: context.applicantEmail,
        status: RevocationNotificationDeliveryStatus.SENT,
        subject,
        messageBody: plainText,
        providerResponse: result.messageId ?? "sent",
      },
      update: {
        status: RevocationNotificationDeliveryStatus.SENT,
        skipReason: null,
        providerResponse: result.messageId ?? "sent",
      },
    });

    return { status: "SENT" };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown email error";

    await prisma.revocationNotificationLog.upsert({
      where: {
        applicationId_eventType: {
          applicationId: context.applicationId,
          eventType,
        },
      },
      create: {
        applicationId: context.applicationId,
        applicantId: context.applicantId,
        inspectionId: context.inspectionId,
        eventType,
        recipientEmail: context.applicantEmail,
        status: RevocationNotificationDeliveryStatus.FAILED,
        subject,
        messageBody: plainText,
        providerResponse: reason,
      },
      update: {
        status: RevocationNotificationDeliveryStatus.FAILED,
        providerResponse: reason,
      },
    });

    return { status: "FAILED", reason };
  }
}

export async function notifyApplicantRevocationEvent(input: {
  inspectionId: string;
  eventType: RevocationNotificationEventType;
  departmentHeadRemarks?: string | null;
  decisionRemarks?: string | null;
  eventDate?: Date;
  departmentOfficerLabel?: string | null;
}): Promise<void> {
  try {
    const context = await loadRevocationNotificationContext(input.inspectionId, input.eventType, {
      departmentHeadRemarks: input.departmentHeadRemarks,
      decisionRemarks: input.decisionRemarks,
      eventDate: input.eventDate,
      departmentOfficerLabel: input.departmentOfficerLabel,
    });

    if (!context) return;

    await sendRevocationEmailNotification(context, input.eventType);
  } catch (error) {
    console.error("[REVOCATION EMAIL] notification failed", {
      inspectionId: input.inspectionId,
      eventType: input.eventType,
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
