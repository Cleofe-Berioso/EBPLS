import { describe, expect, it } from "vitest";
import {
  APPLICATION_STATUS_TRANSITIONS,
  assertStatusTransition,
  canTransitionStatus,
} from "@/lib/application-status";
import type { ApplicationStatus } from "@prisma/client";

const ALL_STATUSES = Object.keys(APPLICATION_STATUS_TRANSITIONS) as ApplicationStatus[];

describe("WB-STATUS — application status machine", () => {
  it("WB-STATUS-01 map covers every ApplicationStatus key", () => {
    expect(ALL_STATUSES.length).toBeGreaterThanOrEqual(14);
    for (const status of ALL_STATUSES) {
      expect(Array.isArray(APPLICATION_STATUS_TRANSITIONS[status])).toBe(true);
    }
  });

  it("WB-STATUS-02 primary NEW pipeline transitions are allowed", () => {
    const spine: Array<[ApplicationStatus, ApplicationStatus]> = [
      ["DRAFT", "SUBMITTED"],
      ["SUBMITTED", "UNDER_REVIEW"],
      ["UNDER_REVIEW", "DEPARTMENT_HEAD_REVIEW"],
      ["DEPARTMENT_HEAD_REVIEW", "DEPARTMENT_HEAD_APPROVED"],
      ["DEPARTMENT_HEAD_APPROVED", "ASSESSED"],
      ["ASSESSED", "APPROVED_FOR_PAYMENT"],
      ["APPROVED_FOR_PAYMENT", "PAID"],
      ["PAID", "FOR_RELEASE"],
      ["FOR_RELEASE", "RELEASED"],
      ["RELEASED", "REVOCATION_REVIEW"],
      ["REVOCATION_REVIEW", "REVOKED"],
    ];
    for (const [from, to] of spine) {
      expect(canTransitionStatus(from, to), `${from} -> ${to}`).toBe(true);
      expect(() => assertStatusTransition(from, to)).not.toThrow();
    }
  });

  it("WB-STATUS-03 return/reject/resubmit/reassessment/deny-revoke paths", () => {
    expect(canTransitionStatus("SUBMITTED", "RETURNED_FOR_CORRECTION")).toBe(true);
    expect(canTransitionStatus("UNDER_REVIEW", "REJECTED")).toBe(true);
    expect(canTransitionStatus("DEPARTMENT_HEAD_REVIEW", "RETURNED_FOR_CORRECTION")).toBe(true);
    expect(canTransitionStatus("RETURNED_FOR_CORRECTION", "SUBMITTED")).toBe(true);
    expect(canTransitionStatus("APPROVED_FOR_PAYMENT", "ASSESSED")).toBe(true);
    expect(canTransitionStatus("REVOCATION_REVIEW", "RELEASED")).toBe(true);
  });

  it("WB-STATUS-04 terminal statuses have no outbound transitions", () => {
    expect(APPLICATION_STATUS_TRANSITIONS.REJECTED).toEqual([]);
    expect(APPLICATION_STATUS_TRANSITIONS.REVOKED).toEqual([]);
  });

  it("WB-STATUS-05 illegal transitions throw via assertStatusTransition", () => {
    expect(() => assertStatusTransition("DRAFT", "RELEASED")).toThrow(/Invalid status transition/);
    expect(() => assertStatusTransition("PAID", "SUBMITTED")).toThrow(/Invalid status transition/);
    expect(() => assertStatusTransition("REJECTED", "SUBMITTED")).toThrow(/Invalid status transition/);
    expect(canTransitionStatus("RELEASED", "PAID")).toBe(false);
  });

  it("WB-STATUS-06 documents known map gap: UNDER_REVIEW→ASSESSED allowed in map (unused by writers)", () => {
    // Confirmed gap: helper allows direct assess skip; production approve writes DEPARTMENT_HEAD_REVIEW.
    expect(canTransitionStatus("UNDER_REVIEW", "ASSESSED")).toBe(true);
    expect(canTransitionStatus("UNDER_REVIEW", "DEPARTMENT_HEAD_REVIEW")).toBe(true);
  });

  it("WB-STATUS-07 payment soft-return is NOT a BusinessApplication status change", () => {
    // Payment return keeps APPROVED_FOR_PAYMENT (PaymentReference REJECTED only).
    expect(canTransitionStatus("APPROVED_FOR_PAYMENT", "RETURNED_FOR_CORRECTION")).toBe(false);
    expect(canTransitionStatus("APPROVED_FOR_PAYMENT", "PAID")).toBe(true);
  });
});
