/**
 * JIT Compliance Classification Constants
 * Used in Department Head verification workflow
 */

export const NON_COMPLIANCE_TYPES = {
  GOVERNMENT_AGENCY_RELATED: {
    value: "GOVERNMENT_AGENCY_RELATED",
    label: "Government Agency Related",
    description: "Minor or major cases may be flagged for settlement. Severe cases may require forced closure processing.",
  },
  RENEWAL_RELATED: {
    value: "RENEWAL_RELATED",
    label: "Renewal Related",
    description: "Renewal may continue later, but renewal-related penalties or fees may apply during assessment.",
  },
} as const;

export const VIOLATION_SEVERITIES = {
  MINOR: {
    value: "MINOR",
    label: "Minor",
  },
  MAJOR: {
    value: "MAJOR",
    label: "Major",
  },
  SEVERE: {
    value: "SEVERE",
    label: "Severe",
  },
} as const;

export const COMPLIANCE_CASE_STATUSES = {
  NONE: {
    value: "NONE",
    label: "None",
  },
  FLAGGED_UNSETTLED: {
    value: "FLAGGED_UNSETTLED",
    label: "Flagged (Unsettled)",
  },
  SETTLED: {
    value: "SETTLED",
    label: "Settled",
  },
  EXPIRED_UNSETTLED: {
    value: "EXPIRED_UNSETTLED",
    label: "Expired (Unsettled)",
  },
  FORCED_CLOSURE_PENDING: {
    value: "FORCED_CLOSURE_PENDING",
    label: "Forced Closure Pending",
  },
  CLOSED_NON_COMPLIANT: {
    value: "CLOSED_NON_COMPLIANT",
    label: "Closed (Non-Compliant)",
  },
} as const;

/**
 * Determine compliance case status based on non-compliance type and violation severity
 * This is used during Department Head verification to classify the case
 */
export function determineComplianceCaseStatus(
  nonComplianceType: string,
  violationSeverity: string
): string {
  // GOVERNMENT_AGENCY_RELATED + SEVERE => FORCED_CLOSURE_PENDING
  if (nonComplianceType === "GOVERNMENT_AGENCY_RELATED" && violationSeverity === "SEVERE") {
    return "FORCED_CLOSURE_PENDING";
  }

  // All other combinations are FLAGGED_UNSETTLED for settlement workflow
  return "FLAGGED_UNSETTLED";
}

/**
 * Determine if forced closure should be applied
 */
export function shouldApplyForcedClosure(
  nonComplianceType: string,
  violationSeverity: string
): boolean {
  return nonComplianceType === "GOVERNMENT_AGENCY_RELATED" && violationSeverity === "SEVERE";
}
