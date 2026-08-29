import { describe, expect, it } from "vitest";
import {
  EDITABLE_APPLICATION_STATUSES,
  isEditableStatus,
  mapDbStatusToUi,
} from "@/lib/application-mappers";

describe("WB-MAP — application status mappers", () => {
  it("WB-MAP-01 only DRAFT and RETURNED_FOR_CORRECTION are editable", () => {
    expect(EDITABLE_APPLICATION_STATUSES).toEqual(["DRAFT", "RETURNED_FOR_CORRECTION"]);
    expect(isEditableStatus("DRAFT")).toBe(true);
    expect(isEditableStatus("RETURNED_FOR_CORRECTION")).toBe(true);
    expect(isEditableStatus("UNDER_REVIEW")).toBe(false);
    expect(isEditableStatus("APPROVED_FOR_PAYMENT")).toBe(false);
    expect(isEditableStatus("RELEASED")).toBe(false);
  });

  it("WB-MAP-02 DB→UI labels for pipeline statuses", () => {
    expect(mapDbStatusToUi("SUBMITTED")).toBe("Submitted");
    expect(mapDbStatusToUi("DEPARTMENT_HEAD_REVIEW")).toBe("Department Head Review");
    expect(mapDbStatusToUi("APPROVED_FOR_PAYMENT")).toBe("Approved for Payment");
    expect(mapDbStatusToUi("RETURNED_FOR_CORRECTION")).toBe("Returned for Correction");
    expect(mapDbStatusToUi("REVOCATION_REVIEW")).toBe("Revocation Review");
  });
});
