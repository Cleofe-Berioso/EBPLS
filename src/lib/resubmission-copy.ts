export type ApplicationFormKind = "NEW" | "RENEWAL" | "CLOSURE";

export const RESUBMIT_BUTTON_LABEL = "Resubmit Application";

export function isReturnedCorrectionResubmission(params: {
  editId: string | null;
  applicationStatus?: string | null;
}): boolean {
  return Boolean(params.editId && params.applicationStatus === "Returned for Correction");
}

export function getApplicationSubmitButtonLabel(
  kind: ApplicationFormKind,
  isResubmission: boolean
): string {
  if (isResubmission) {
    return RESUBMIT_BUTTON_LABEL;
  }

  switch (kind) {
    case "NEW":
      return "Submit Application";
    case "RENEWAL":
      return "Submit Renewal";
    case "CLOSURE":
      return "Submit Closure";
  }
}

export function getApplicationSubmitSuccessMessage(
  kind: ApplicationFormKind,
  isResubmission: boolean,
  applicationNumber: string
): string {
  if (isResubmission) {
    switch (kind) {
      case "NEW":
        return "Application resubmitted successfully.";
      case "RENEWAL":
        return "Renewal resubmitted successfully.";
      case "CLOSURE":
        return "Closure resubmitted successfully.";
    }
  }

  switch (kind) {
    case "NEW":
      return `Application ${applicationNumber} submitted successfully.`;
    case "RENEWAL":
      return `Renewal ${applicationNumber} submitted successfully.`;
    case "CLOSURE":
      return `Closure ${applicationNumber} submitted successfully.`;
  }
}

export function getResubmissionConfirmMessage(kind: ApplicationFormKind): string {
  switch (kind) {
    case "NEW":
      return "You are about to resubmit your corrected application. Continue?";
    case "RENEWAL":
      return "You are about to resubmit your corrected renewal. Continue?";
    case "CLOSURE":
      return "You are about to resubmit your corrected closure request. Continue?";
  }
}
