import {
  RenewalEmailDeliveryStatus,
  RenewalEmailNotificationType,
  type ApplicationStatus,
  type ApplicationType,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateRenewalEmailHtml, isEmailConfigured, sendEmail } from "@/lib/mail";
import {
  buildRenewalEmailPlainText,
  buildRenewalEmailSubject,
  DEFAULT_SUPPORT_EMAIL,
} from "@/lib/renewal-email-copy";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const IN_PROGRESS_RENEWAL_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "DEPARTMENT_HEAD_REVIEW",
  "DEPARTMENT_HEAD_APPROVED",
  "ASSESSED",
  "APPROVED_FOR_PAYMENT",
  "PAID",
  "FOR_RELEASE",
  "RETURNED_FOR_CORRECTION",
  "REVOCATION_REVIEW",
] as const;

export interface RunRenewalEmailNotificationsInput {
  dryRun?: boolean;
  businessRecordId?: string;
}

export interface RenewalEmailRunSummary {
  dryRun: boolean;
  scanned: number;
  eligible: number;
  sent: number;
  skipped: number;
  failed: number;
  wouldSend: number;
  details: RenewalEmailRunDetail[];
}

export interface RenewalEmailRunDetail {
  businessRecordId: string;
  businessName: string;
  notificationType: RenewalEmailNotificationType | null;
  recipientEmail: string | null;
  outcome: "SENT" | "FAILED" | "SKIPPED" | "WOULD_SEND";
  reason?: string;
}

function isRenewalEmailEnabled(): boolean {
  return process.env.RENEWAL_EMAIL_ENABLED?.trim().toLowerCase() === "true";
}

function resolveUpcomingDays(): number {
  const raw = process.env.RENEWAL_UPCOMING_DAYS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : 30;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
}

function resolveAppUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000";
  return base.replace(/\/+$/, "");
}

function resolveSupportEmail(): string {
  return process.env.SUPPORT_EMAIL?.trim() || DEFAULT_SUPPORT_EMAIL;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysUntilExpiration(now: Date, expirationDate: Date): number {
  const today = startOfUtcDay(now).getTime();
  const expiryDay = startOfUtcDay(expirationDate).getTime();
  return Math.round((expiryDay - today) / (1000 * 60 * 60 * 24));
}

function classifyNotificationType(
  now: Date,
  expirationDate: Date
): RenewalEmailNotificationType | null {
  const daysRemaining = daysUntilExpiration(now, expirationDate);
  const upcomingDays = resolveUpcomingDays();

  if (daysRemaining < 0) {
    return RenewalEmailNotificationType.OVERDUE;
  }
  if (daysRemaining === 0) {
    return RenewalEmailNotificationType.DUE;
  }
  if (daysRemaining > 0 && daysRemaining <= upcomingDays) {
    return RenewalEmailNotificationType.UPCOMING;
  }
  return null;
}

function formatExpirationDateLabel(expirationDate: Date): string {
  return expirationDate.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function normalizeEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || !EMAIL_REGEX.test(trimmed)) return null;
  return trimmed;
}

function resolveRecipientEmail(
  businessEmail: string,
  applicantEmail: string
): string | null {
  return normalizeEmail(businessEmail) ?? normalizeEmail(applicantEmail);
}

function buildEmailContent(input: {
  businessName: string;
  permitNumber: string | null;
  expirationDate: Date;
  notificationType: RenewalEmailNotificationType;
}) {
  const appUrl = resolveAppUrl();
  const supportEmail = resolveSupportEmail();
  const expirationDateLabel = formatExpirationDateLabel(input.expirationDate);
  const renewUrl = `${appUrl}/login`;

  const copyInput = {
    businessName: input.businessName,
    permitNumber: input.permitNumber,
    expirationDateLabel,
    notificationType: input.notificationType,
    appUrl: renewUrl,
    supportEmail,
  };

  const subject = buildRenewalEmailSubject(copyInput);
  const plainText = buildRenewalEmailPlainText(copyInput);

  const intro =
    input.notificationType === RenewalEmailNotificationType.UPCOMING
      ? `This is a reminder that the business permit for ${input.businessName} will expire on ${expirationDateLabel}. Please prepare and submit your renewal application before the deadline.`
      : input.notificationType === RenewalEmailNotificationType.DUE
        ? `The business permit for ${input.businessName} is due for renewal today (${expirationDateLabel}). Please submit your renewal application as soon as possible.`
        : `The business permit for ${input.businessName} expired on ${expirationDateLabel} and is now overdue. Please submit your renewal application immediately to restore compliance.`;

  const heading =
    input.notificationType === RenewalEmailNotificationType.UPCOMING
      ? "Business Permit Renewal Reminder"
      : input.notificationType === RenewalEmailNotificationType.DUE
        ? "Business Permit Renewal Due Today"
        : "Overdue Business Permit Renewal Notice";

  const html = generateRenewalEmailHtml({
    heading,
    intro,
    businessName: input.businessName,
    permitNumber: input.permitNumber,
    expirationDateLabel,
    renewUrl,
    supportEmail,
  });

  return { subject, plainText, html };
}

type RenewalCandidate = {
  id: string;
  businessName: string;
  email: string;
  applicantId: string;
  permitExpirationDate: Date;
  applicant: { email: string };
  applications: Array<{
    id: string;
    applicationType: ApplicationType;
    status: ApplicationStatus;
    permitIssuance: { documentNumber: string | null } | null;
  }>;
};

async function loadRenewalCandidates(businessRecordId?: string): Promise<RenewalCandidate[]> {
  const where: Prisma.BusinessRecordWhereInput = {
    businessStatus: "ACTIVE",
    permitExpirationDate: { not: null },
    ...(businessRecordId ? { id: businessRecordId } : {}),
  };

  const rows = await prisma.businessRecord.findMany({
    where,
    select: {
      id: true,
      businessName: true,
      email: true,
      applicantId: true,
      permitExpirationDate: true,
      applicant: {
        select: {
          email: true,
        },
      },
      applications: {
        where: {
          OR: [
            {
              status: "RELEASED",
              applicationType: { in: ["NEW", "RENEWAL"] },
            },
            {
              applicationType: "RENEWAL",
              status: { in: [...IN_PROGRESS_RENEWAL_STATUSES] },
            },
          ],
        },
        select: {
          id: true,
          applicationType: true,
          status: true,
          permitIssuance: {
            select: {
              documentNumber: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });

  return rows.filter(
    (row): row is RenewalCandidate => row.permitExpirationDate instanceof Date
  );
}

function hasInProgressRenewal(applications: RenewalCandidate["applications"]): boolean {
  return applications.some(
    (app) =>
      app.applicationType === "RENEWAL" &&
      (IN_PROGRESS_RENEWAL_STATUSES as readonly ApplicationStatus[]).includes(app.status)
  );
}

function resolveLatestReleasedPermit(
  applications: RenewalCandidate["applications"]
): { applicationId: string; permitNumber: string | null } | null {
  const released = applications.find(
    (app) =>
      app.status === "RELEASED" &&
      (app.applicationType === "NEW" || app.applicationType === "RENEWAL")
  );
  if (!released) return null;
  return {
    applicationId: released.id,
    permitNumber: released.permitIssuance?.documentNumber ?? null,
  };
}

async function findExistingLog(
  businessRecordId: string,
  permitExpirationDate: Date,
  notificationType: RenewalEmailNotificationType
) {
  return prisma.renewalEmailLog.findUnique({
    where: {
      businessRecordId_permitExpirationDate_notificationType: {
        businessRecordId,
        permitExpirationDate,
        notificationType,
      },
    },
  });
}

async function createRenewalEmailLog(input: {
  businessRecordId: string;
  applicantId: string;
  applicationId: string | null;
  recipientEmail: string;
  notificationType: RenewalEmailNotificationType;
  permitExpirationDate: Date;
  permitNumber: string | null;
  businessName: string;
  status: RenewalEmailDeliveryStatus;
  subject: string;
  messageBody: string;
  skipReason?: string;
  providerResponse?: string;
}) {
  return prisma.renewalEmailLog.create({
    data: {
      businessRecordId: input.businessRecordId,
      applicantId: input.applicantId,
      applicationId: input.applicationId,
      recipientEmail: input.recipientEmail,
      notificationType: input.notificationType,
      permitExpirationDate: input.permitExpirationDate,
      permitNumber: input.permitNumber,
      businessName: input.businessName,
      status: input.status,
      subject: input.subject,
      messageBody: input.messageBody,
      skipReason: input.skipReason ?? null,
      providerResponse: input.providerResponse ?? null,
    },
  });
}

async function processCandidate(
  candidate: RenewalCandidate,
  now: Date,
  dryRun: boolean
): Promise<RenewalEmailRunDetail> {
  const expirationDate = candidate.permitExpirationDate;
  const notificationType = classifyNotificationType(now, expirationDate);

  if (!notificationType) {
    return {
      businessRecordId: candidate.id,
      businessName: candidate.businessName,
      notificationType: null,
      recipientEmail: null,
      outcome: "SKIPPED",
      reason: "NOT_IN_NOTIFICATION_WINDOW",
    };
  }

  if (hasInProgressRenewal(candidate.applications)) {
    return {
      businessRecordId: candidate.id,
      businessName: candidate.businessName,
      notificationType,
      recipientEmail: null,
      outcome: "SKIPPED",
      reason: "RENEWAL_ALREADY_IN_PROGRESS",
    };
  }

  const recipientEmail = resolveRecipientEmail(candidate.email, candidate.applicant.email);
  if (!recipientEmail) {
    return {
      businessRecordId: candidate.id,
      businessName: candidate.businessName,
      notificationType,
      recipientEmail: null,
      outcome: "SKIPPED",
      reason: "INVALID_OR_MISSING_EMAIL",
    };
  }

  const existingLog = await findExistingLog(candidate.id, expirationDate, notificationType);
  if (existingLog) {
    return {
      businessRecordId: candidate.id,
      businessName: candidate.businessName,
      notificationType,
      recipientEmail,
      outcome: "SKIPPED",
      reason: "ALREADY_LOGGED",
    };
  }

  const releasedPermit = resolveLatestReleasedPermit(candidate.applications);
  const permitNumber = releasedPermit?.permitNumber ?? null;
  const applicationId = releasedPermit?.applicationId ?? null;

  const { subject, plainText, html } = buildEmailContent({
    businessName: candidate.businessName,
    permitNumber,
    expirationDate,
    notificationType,
  });

  if (dryRun) {
    return {
      businessRecordId: candidate.id,
      businessName: candidate.businessName,
      notificationType,
      recipientEmail,
      outcome: "WOULD_SEND",
      reason: "DRY_RUN",
    };
  }

  if (!isRenewalEmailEnabled()) {
    await createRenewalEmailLog({
      businessRecordId: candidate.id,
      applicantId: candidate.applicantId,
      applicationId,
      recipientEmail,
      notificationType,
      permitExpirationDate: expirationDate,
      permitNumber,
      businessName: candidate.businessName,
      status: RenewalEmailDeliveryStatus.SKIPPED,
      subject,
      messageBody: plainText,
      skipReason: "RENEWAL_EMAIL_DISABLED",
    });

    return {
      businessRecordId: candidate.id,
      businessName: candidate.businessName,
      notificationType,
      recipientEmail,
      outcome: "SKIPPED",
      reason: "RENEWAL_EMAIL_DISABLED",
    };
  }

  if (!isEmailConfigured()) {
    await createRenewalEmailLog({
      businessRecordId: candidate.id,
      applicantId: candidate.applicantId,
      applicationId,
      recipientEmail,
      notificationType,
      permitExpirationDate: expirationDate,
      permitNumber,
      businessName: candidate.businessName,
      status: RenewalEmailDeliveryStatus.SKIPPED,
      subject,
      messageBody: plainText,
      skipReason: "SMTP_NOT_CONFIGURED",
    });

    return {
      businessRecordId: candidate.id,
      businessName: candidate.businessName,
      notificationType,
      recipientEmail,
      outcome: "SKIPPED",
      reason: "SMTP_NOT_CONFIGURED",
    };
  }

  try {
    const result = await sendEmail({
      to: recipientEmail,
      subject,
      html,
    });

    await createRenewalEmailLog({
      businessRecordId: candidate.id,
      applicantId: candidate.applicantId,
      applicationId,
      recipientEmail,
      notificationType,
      permitExpirationDate: expirationDate,
      permitNumber,
      businessName: candidate.businessName,
      status: RenewalEmailDeliveryStatus.SENT,
      subject,
      messageBody: plainText,
      providerResponse: result.messageId ?? "sent",
    });

    return {
      businessRecordId: candidate.id,
      businessName: candidate.businessName,
      notificationType,
      recipientEmail,
      outcome: "SENT",
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown send error";

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return {
        businessRecordId: candidate.id,
        businessName: candidate.businessName,
        notificationType,
        recipientEmail,
        outcome: "SKIPPED",
        reason: "ALREADY_LOGGED",
      };
    }

    try {
      await createRenewalEmailLog({
        businessRecordId: candidate.id,
        applicantId: candidate.applicantId,
        applicationId,
        recipientEmail,
        notificationType,
        permitExpirationDate: expirationDate,
        permitNumber,
        businessName: candidate.businessName,
        status: RenewalEmailDeliveryStatus.FAILED,
        subject,
        messageBody: plainText,
        providerResponse: reason,
      });
    } catch (logError) {
      if (
        logError &&
        typeof logError === "object" &&
        "code" in logError &&
        (logError as { code?: string }).code === "P2002"
      ) {
        return {
          businessRecordId: candidate.id,
          businessName: candidate.businessName,
          notificationType,
          recipientEmail,
          outcome: "SKIPPED",
          reason: "ALREADY_LOGGED",
        };
      }
      console.error("[RENEWAL EMAIL] failed to write failure log", logError);
    }

    return {
      businessRecordId: candidate.id,
      businessName: candidate.businessName,
      notificationType,
      recipientEmail,
      outcome: "FAILED",
      reason,
    };
  }
}

export async function runRenewalEmailNotifications(
  input: RunRenewalEmailNotificationsInput = {}
): Promise<RenewalEmailRunSummary> {
  const dryRun = input.dryRun === true;
  const now = new Date();
  const candidates = await loadRenewalCandidates(input.businessRecordId);

  const details: RenewalEmailRunDetail[] = [];
  let eligible = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let wouldSend = 0;

  for (const candidate of candidates) {
    const detail = await processCandidate(candidate, now, dryRun);
    details.push(detail);

    if (detail.notificationType) {
      eligible += 1;
    }

    switch (detail.outcome) {
      case "SENT":
        sent += 1;
        break;
      case "FAILED":
        failed += 1;
        break;
      case "WOULD_SEND":
        wouldSend += 1;
        break;
      case "SKIPPED":
        skipped += 1;
        break;
    }
  }

  return {
    dryRun,
    scanned: candidates.length,
    eligible,
    sent,
    skipped,
    failed,
    wouldSend,
    details,
  };
}

export function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) {
    return true;
  }

  const headerSecret = request.headers.get("x-cron-secret");
  return headerSecret === secret;
}
