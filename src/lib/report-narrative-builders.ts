import { reportPercentOf } from "@/lib/printable-reports";

export const REPORT_PURPOSES = {
  applications:
    "This report converts application records into an operational picture of municipal filing volume, workflow stage, and completion progress.",
  registry:
    "This report explains the current business masterlist — who is active, who is inactive or closed, and which records still carry a released permit reference.",
  closures:
    "This report tracks business exit filings and whether closure certificates reached release, supporting inventory and compliance follow-up.",
  inspections:
    "This report summarizes JIT field findings and Department Head verification outcomes for compliance monitoring.",
  auditTrail:
    "This report documents accountability — which actor performed which action, when, and with what remarks across system modules.",
  sms:
    "This report evaluates notification reliability by showing whether applicant SMS messages were sent, skipped, or failed.",
  monthlySummary:
    "This monthly summary turns system activity into a management briefing — filing volume, releases, inspections, payments, and operational signals for the selected month.",
} as const;

export function buildApplicationReportNarrative(input: {
  total: number;
  totalNew: number;
  totalRenewal: number;
  totalClosure: number;
  totalReleased: number;
  dateRange: string;
}) {
  const bullets: string[] = [];
  if (input.total === 0) {
    return {
      paragraphs: [
        `No application records matched the selected filters (${input.dateRange}). This usually means no filings were submitted in that period, or filters are too narrow.`,
      ],
      bullets: ["Review the date range and status filters, then regenerate if a wider period is needed."],
    };
  }

  bullets.push(
    `${input.totalNew.toLocaleString("en-PH")} new (${reportPercentOf(input.totalNew, input.total)}), ${input.totalRenewal.toLocaleString("en-PH")} renewal (${reportPercentOf(input.totalRenewal, input.total)}), and ${input.totalClosure.toLocaleString("en-PH")} closure (${reportPercentOf(input.totalClosure, input.total)}) filings are in scope.`
  );
  bullets.push(
    `${input.totalReleased.toLocaleString("en-PH")} records reached Released (${reportPercentOf(input.totalReleased, input.total)}), indicating completed permit or certificate processing for that cohort.`
  );
  if (input.totalReleased < input.total) {
    bullets.push(
      `${(input.total - input.totalReleased).toLocaleString("en-PH")} records remain outside Released — these represent pipeline work still owned by applicants, BPLO, Department Head, or release staff.`
    );
  }

  return {
    paragraphs: [
      `Within ${input.dateRange}, the system recorded ${input.total.toLocaleString("en-PH")} application${input.total === 1 ? "" : "s"}. The counts below translate filing volume into workload meaning for BPLO and IT oversight.`,
    ],
    bullets,
  };
}

export function buildRegistryReportNarrative(input: {
  total: number;
  activeCount: number;
  inactiveCount: number;
  closedCount: number;
  withPermit: number;
}) {
  if (input.total === 0) {
    return {
      paragraphs: ["No business registry records matched the selected filters."],
      bullets: ["Adjust barangay, business type, or status filters to widen the masterlist view."],
    };
  }

  return {
    paragraphs: [
      `The registry contains ${input.total.toLocaleString("en-PH")} business record${input.total === 1 ? "" : "s"} in this view. Use the status mix to distinguish operating businesses from inactive or closed entries.`,
    ],
    bullets: [
      `${input.activeCount.toLocaleString("en-PH")} active (${reportPercentOf(input.activeCount, input.total)}) — expected to appear on maps, renewals, and inspection targets.`,
      `${input.inactiveCount.toLocaleString("en-PH")} inactive (${reportPercentOf(input.inactiveCount, input.total)}) — may need BPLO confirmation before field action.`,
      `${input.closedCount.toLocaleString("en-PH")} closed (${reportPercentOf(input.closedCount, input.total)}) — should align with closure certificate history where applicable.`,
      `${input.withPermit.toLocaleString("en-PH")} records (${reportPercentOf(input.withPermit, input.total)}) still reference a released permit number.`,
    ],
  };
}

export function buildClosureReportNarrative(input: {
  total: number;
  releasedCount: number;
  pendingCount: number;
  dateRange: string;
}) {
  if (input.total === 0) {
    return {
      paragraphs: [`No closure applications were found for ${input.dateRange}.`],
      bullets: [],
    };
  }

  return {
    paragraphs: [
      `${input.total.toLocaleString("en-PH")} closure filing${input.total === 1 ? "" : "s"} appear in ${input.dateRange}. This section helps confirm whether exit documentation was completed.`,
    ],
    bullets: [
      `${input.releasedCount.toLocaleString("en-PH")} closure certificate${input.releasedCount === 1 ? "" : "s"} reached Released.`,
      `${input.pendingCount.toLocaleString("en-PH")} remain outside release — follow up on document validation, assessment, or certificate preparation.`,
    ],
  };
}

export function buildInspectionReportNarrative(input: {
  total: number;
  totalCompliant: number;
  totalNonCompliant: number;
  totalPendingReview: number;
  pendingVerification: number;
  dateRange: string;
}) {
  if (input.total === 0) {
    return {
      paragraphs: [`No JIT inspection records were found for ${input.dateRange}.`],
      bullets: [],
    };
  }

  const bullets = [
    `${input.totalCompliant.toLocaleString("en-PH")} compliant (${reportPercentOf(input.totalCompliant, input.total)}).`,
    `${input.totalNonCompliant.toLocaleString("en-PH")} non-compliant (${reportPercentOf(input.totalNonCompliant, input.total)}).`,
    `${input.totalPendingReview.toLocaleString("en-PH")} still pending BPLO review.`,
  ];
  if (input.pendingVerification > 0) {
    bullets.push(
      `${input.pendingVerification.toLocaleString("en-PH")} await Department Head verification — JIT findings are not final until verified.`
    );
  }

  return {
    paragraphs: [
      `${input.total.toLocaleString("en-PH")} inspection${input.total === 1 ? "" : "s"} were recorded in ${input.dateRange}. Use compliance counts to gauge field enforcement pressure and revocation readiness.`,
    ],
    bullets,
  };
}

export function buildAuditTrailReportNarrative(input: {
  total: number;
  dateRange: string;
}) {
  if (input.total === 0) {
    return {
      paragraphs: [`No audit entries matched ${input.dateRange}.`],
      bullets: [],
    };
  }

  return {
    paragraphs: [
      `${input.total.toLocaleString("en-PH")} audit event${input.total === 1 ? "" : "s"} are listed for ${input.dateRange}. Each row is evidence of who changed system state and should be read chronologically when investigating incidents.`,
    ],
    bullets: [
      "Cross-check actor role against the module to confirm the action was expected.",
      "Use remarks and status transitions to reconstruct approval or correction sequences.",
    ],
  };
}

export function buildSmsReportNarrative(input: {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  dateRange: string;
}) {
  if (input.total === 0) {
    return {
      paragraphs: [`No SMS delivery attempts were logged for ${input.dateRange}.`],
      bullets: [],
    };
  }

  return {
    paragraphs: [
      `${input.total.toLocaleString("en-PH")} SMS log${input.total === 1 ? "" : "s"} cover ${input.dateRange}. Delivery health affects applicant awareness for renewals, payments, and compliance notices.`,
    ],
    bullets: [
      `${input.sent.toLocaleString("en-PH")} sent (${reportPercentOf(input.sent, input.total)}).`,
      `${input.failed.toLocaleString("en-PH")} failed (${reportPercentOf(input.failed, input.total)}) — review provider configuration or phone formatting.`,
      `${input.skipped.toLocaleString("en-PH")} skipped (${reportPercentOf(input.skipped, input.total)}) — often due to missing contact numbers or disabled SMS.`,
    ],
  };
}

export function buildMonthlySummaryNarrative(input: {
  periodLabel: string;
  applicationsSubmitted: number;
  permitsReleased: number;
  closureCertificatesReleased: number;
  inspectionsConducted: number;
  verifiedPayments: number;
  paymentAmount: number;
  bploActions: number;
  newUsers: number;
  releasedApplications: number;
  returnedForCorrection: number;
}) {
  const bullets: string[] = [
    `${input.applicationsSubmitted.toLocaleString("en-PH")} application${input.applicationsSubmitted === 1 ? "" : "s"} submitted during ${input.periodLabel}.`,
    `${input.releasedApplications.toLocaleString("en-PH")} application${input.releasedApplications === 1 ? "" : "s"} reached Released status in the same month.`,
    `${input.permitsReleased.toLocaleString("en-PH")} business permit${input.permitsReleased === 1 ? "" : "s"} and ${input.closureCertificatesReleased.toLocaleString("en-PH")} closure certificate${input.closureCertificatesReleased === 1 ? "" : "s"} were released.`,
    `${input.inspectionsConducted.toLocaleString("en-PH")} JIT inspection${input.inspectionsConducted === 1 ? "" : "s"} recorded.`,
    `${input.verifiedPayments.toLocaleString("en-PH")} verified payment${input.verifiedPayments === 1 ? "" : "s"} totaling the amount shown in Section 4.`,
    `${input.bploActions.toLocaleString("en-PH")} BPLO workflow action${input.bploActions === 1 ? "" : "s"} logged in application history.`,
    `${input.newUsers.toLocaleString("en-PH")} new user account${input.newUsers === 1 ? "" : "s"} registered.`,
  ];

  if (input.returnedForCorrection > 0) {
    bullets.push(
      `${input.returnedForCorrection.toLocaleString("en-PH")} application${input.returnedForCorrection === 1 ? "" : "s"} returned for correction — applicant follow-up may be delaying release.`
    );
  }

  return {
    paragraphs: [
      `This executive summary interprets municipal BPOS activity for ${input.periodLabel}. It is intended for IT oversight, BPLO management briefings, and archival monthly reporting — not as a substitute for line-level audit evidence.`,
      input.applicationsSubmitted === 0
        ? "No submissions were recorded this month. Confirm whether the period is correct or whether filing activity occurred outside the system."
        : "The sections that follow break the month into filing mix, financial signals, compliance activity, and detailed status tables.",
    ],
    bullets,
  };
}
