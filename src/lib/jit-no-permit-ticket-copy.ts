export const NO_PERMIT_NOTICE_TITLE = "No Valid Business Permit Record";

export const DEFAULT_NO_PERMIT_REQUIRED_ACTION =
  "Apply for a business permit at the Business Permit and Licensing Office (BPLO). Present this notice reference number during follow-up and comply with municipal business permit requirements.";

export const DEFAULT_SUPPORT_EMAIL = "support@bplo.gov.ph";

export function resolveInspectingOfficeLabel(): string {
  return (
    process.env.JIT_NO_PERMIT_INSPECTING_OFFICE?.trim() ||
    "Joint Inspection Team (JIT) — Business Permit and Licensing Office, Municipality of Enrique B. Magalona"
  );
}

export function buildDefaultFindings(input: {
  lineOfBusiness: string;
  remarks?: string | null;
}): string {
  const base = `Inspection confirmed no valid business permit record for this ${input.lineOfBusiness} establishment.`;
  const remarks = input.remarks?.trim();
  return remarks ? `${base} ${remarks}` : base;
}

export function buildNoPermitSmsMessage(input: {
  businessName: string;
  ticketNumber: string;
  supportEmail?: string;
}): string {
  const support = input.supportEmail ?? DEFAULT_SUPPORT_EMAIL;
  return (
    `BPOS Notice (${input.ticketNumber}): No valid business permit record for ${input.businessName}. ` +
    `Please apply at BPLO. Reference: ${input.ticketNumber}. Contact: ${support}`
  ).replace(/\s+/g, " ").trim();
}

export function buildNoPermitEmailSubject(ticketNumber: string): string {
  return `${NO_PERMIT_NOTICE_TITLE} — ${ticketNumber}`;
}

export function buildNoPermitEmailPlainText(input: {
  businessName: string;
  personAttended: string;
  ticketNumber: string;
  requiredAction: string;
  supportEmail?: string;
}): string {
  const support = input.supportEmail ?? DEFAULT_SUPPORT_EMAIL;
  return [
    NO_PERMIT_NOTICE_TITLE,
    "",
    `Reference: ${input.ticketNumber}`,
    `Establishment: ${input.businessName}`,
    `Witness: ${input.personAttended}`,
    "",
    input.requiredAction,
    "",
    `For assistance, contact BPLO at ${support}.`,
    "",
    "This is an automated notice. Please do not reply to this email.",
  ].join("\n");
}
