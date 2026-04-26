import { describe, expect, it } from "vitest";
import {
  canApplicantDownloadPermit,
  canApplicantMutateApplication,
  canCreatePayment,
  canGeneratePermit,
  canStartReview,
  canVerifyPayment,
} from "@/lib/workflow";

describe("workflow authorization gates", () => {
  it("allows applicants to edit only drafts and returned applications", () => {
    expect(canApplicantMutateApplication("DRAFT")).toBe(true);
    expect(canApplicantMutateApplication("RETURNED_FOR_CORRECTION")).toBe(true);
    expect(canApplicantMutateApplication("SUBMITTED")).toBe(false);
    expect(canApplicantMutateApplication("PAID")).toBe(false);
  });

  it("allows BPLO review only for submitted review queue statuses", () => {
    expect(canStartReview("SUBMITTED")).toBe(true);
    expect(canStartReview("RESUBMITTED")).toBe(true);
    expect(canStartReview("UNDER_REVIEW")).toBe(true);
    expect(canStartReview("PAYMENT_PENDING")).toBe(false);
  });

  it("prevents payment before BPLO assessment and verification before payment pending", () => {
    expect(canCreatePayment("SUBMITTED")).toBe(false);
    expect(canCreatePayment("PAYMENT_PENDING")).toBe(true);
    expect(canVerifyPayment("UNDER_REVIEW")).toBe(false);
    expect(canVerifyPayment("PAYMENT_PENDING")).toBe(true);
  });

  it("blocks permit generation until payment is verified", () => {
    expect(canGeneratePermit("PAYMENT_PENDING")).toBe(false);
    expect(canGeneratePermit("PAID")).toBe(true);
    expect(canGeneratePermit("PERMIT_PREPARED")).toBe(false);
  });

  it("gates applicant permit download by release-stage statuses", () => {
    expect(canApplicantDownloadPermit("PERMIT_PREPARED")).toBe(false);
    expect(canApplicantDownloadPermit("READY_FOR_RELEASE")).toBe(true);
    expect(canApplicantDownloadPermit("RELEASED")).toBe(true);
    expect(canApplicantDownloadPermit("COMPLETED")).toBe(true);
  });
});
