import { describe, expect, it } from "vitest";
import {
  getMissingRequiredDocuments,
  normalizeDocumentName,
  resolveRequiredDocuments,
} from "@/lib/required-documents";
import { baseBusinessInfo } from "./fixtures";

describe("WB-DOCS — required document resolution", () => {
  it("WB-DOCS-01 NEW sole + owned includes base + DTI + title docs", () => {
    const docs = resolveRequiredDocuments({
      applicationType: "NEW",
      formData: baseBusinessInfo(),
    });
    expect(docs).toEqual(expect.arrayContaining(["BFP Clearance", "DTI Certificate"]));
    expect(docs.some((d) => /Transfer Certificate of Title|Tax Declaration/i.test(d))).toBe(true);
    expect(docs).not.toContain("Market Clearance");
  });

  it("WB-DOCS-02 NEW corporation uses SEC Certificate", () => {
    const docs = resolveRequiredDocuments({
      applicationType: "NEW",
      formData: baseBusinessInfo({ businessType: "Corporation" }),
    });
    expect(docs).toContain("SEC Certificate");
    expect(docs).not.toContain("DTI Certificate");
  });

  it("WB-DOCS-03 conditional market/agri/tax incentive docs", () => {
    const docs = resolveRequiredDocuments({
      applicationType: "NEW",
      formData: baseBusinessInfo({
        isMarket: true,
        isAgriculture: true,
        hasTaxIncentives: "YES",
      }),
    });
    expect(docs).toEqual(
      expect.arrayContaining(["Market Clearance", "Agriculture Clearance", "Tax Incentive Certificate/Proof"])
    );
  });

  it("WB-DOCS-04 RENEWAL base set differs from NEW", () => {
    const renewal = resolveRequiredDocuments({
      applicationType: "RENEWAL",
      formData: baseBusinessInfo(),
    });
    expect(renewal).toEqual(
      expect.arrayContaining([
        "Sworn Declaration of Gross Sales / Income Tax Return",
        "BFP Clearance",
      ])
    );
    expect(renewal).not.toContain("DTI Certificate");
  });

  it("WB-DOCS-05 CLOSURE required set", () => {
    const closure = resolveRequiredDocuments({
      applicationType: "CLOSURE",
      formData: baseBusinessInfo(),
    });
    expect(closure).toEqual(
      expect.arrayContaining(["Closure Letter", "Barangay Certification", "Proof of Ceased Operation"])
    );
    expect(closure).toHaveLength(3);
  });

  it("WB-DOCS-06 missing required detection + alias normalize", () => {
    const required = resolveRequiredDocuments({
      applicationType: "NEW",
      formData: baseBusinessInfo(),
    });
    const missing = getMissingRequiredDocuments(required, ["Zoning Clearance"]);
    expect(missing.length).toBe(required.length - 1);
    expect(normalizeDocumentName("Fire Safety Clearance")).toBe("bfp clearance");
    expect(normalizeDocumentName("DTI Registration Certificate")).toBe("dti certificate");
  });

  it("WB-DOCS-07 not-owned property requires lease/MOA style doc", () => {
    const docs = resolveRequiredDocuments({
      applicationType: "NEW",
      formData: baseBusinessInfo({ propertyOwnership: "Not Owned" }),
    });
    expect(docs.some((d) => /Lease|MOA|Written Consent/i.test(d))).toBe(true);
  });
});
