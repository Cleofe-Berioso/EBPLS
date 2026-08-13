import type { RenewalEmailNotificationType } from "@prisma/client";

export const DEFAULT_SUPPORT_EMAIL = "support@bplo.gov.ph";

export interface RenewalEmailContentInput {
  businessName: string;
  permitNumber: string | null;
  expirationDateLabel: string;
  notificationType: RenewalEmailNotificationType;
  appUrl: string;
  supportEmail: string;
}

function headingForType(type: RenewalEmailNotificationType): string {
  switch (type) {
    case "UPCOMING":
      return "Business Permit Renewal Reminder";
    case "DUE":
      return "Business Permit Renewal Due Today";
    case "OVERDUE":
      return "Overdue Business Permit Renewal Notice";
  }
}

function introForType(type: RenewalEmailNotificationType, businessName: string, expirationDateLabel: string): string {
  switch (type) {
    case "UPCOMING":
      return `This is a reminder that the business permit for ${businessName} will expire on ${expirationDateLabel}. Please prepare and submit your renewal application before the deadline.`;
    case "DUE":
      return `The business permit for ${businessName} is due for renewal today (${expirationDateLabel}). Please submit your renewal application as soon as possible.`;
    case "OVERDUE":
      return `The business permit for ${businessName} expired on ${expirationDateLabel} and is now overdue. Please submit your renewal application immediately to restore compliance.`;
  }
}

export function buildRenewalEmailSubject(input: Pick<RenewalEmailContentInput, "notificationType" | "businessName">): string {
  const prefix = headingForType(input.notificationType);
  return `${prefix} — ${input.businessName}`;
}

export function buildRenewalEmailPlainText(input: RenewalEmailContentInput): string {
  const permitLine = input.permitNumber
    ? `Permit number: ${input.permitNumber}`
    : "Permit number: Not available";

  return [
    headingForType(input.notificationType),
    "",
    introForType(input.notificationType, input.businessName, input.expirationDateLabel),
    "",
    `Business name: ${input.businessName}`,
    permitLine,
    `Renewal deadline: ${input.expirationDateLabel}`,
    "",
    "To renew, sign in to the Business Permit Online System and submit a renewal application:",
    input.appUrl,
    "",
    `If you need assistance, contact BPLO at ${input.supportEmail}.`,
    "",
    "This is an automated message. Please do not reply to this email.",
  ].join("\n");
}
