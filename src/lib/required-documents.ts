import type { ApplicationType, BusinessInfo } from "@/lib/applicant-types";

interface RequiredDocumentContext {
  applicationType: ApplicationType;
  formData: BusinessInfo;
}

const NEW_BASE_DOCUMENTS = [
  "Barangay Clearance",
  "Community Tax Certificate",
  "Valid ID",
  "Location Sketch / Plan",
  "Affidavit of No Structural Changes",
  "Zoning Clearance",
  "Sanitary Clearance",
  "Environment Clearance",
  "Engineering Clearance",
  "Fire Safety Clearance",
  "RPT Clearance",
  "Water Bill Clearance",
  "Assessor's Clearance",
] as const;

const BUSINESS_TYPE_DOCUMENTS: Record<BusinessInfo["businessType"], string[]> = {
  "Sole Proprietorship": ["DTI Certificate"],
  "One Person Corporation": ["SEC Registration"],
  Partnership: ["SEC Registration"],
  Corporation: ["SEC Registration"],
  Cooperative: ["CDA Certificate"],
};

const OWNERSHIP_DOCUMENTS = {
  Owned: ["Tax Declaration", "Property Identification Number Proof"],
  "Not Owned": ["Lease Contract", "MOA", "Owner Consent"],
} as const;

const RENEWAL_BASE_DOCUMENTS = [
  "Audited / Unaudited Financial Statement",
  "Gross Receipts Declaration",
  "Income Tax Return",
  "Location Sketch / Plan",
  "Affidavit of No Structural Changes",
  "Sanitary Clearance",
  "Environment Clearance",
  "Engineering Clearance",
  "Fire Safety Clearance",
  "RPT Clearance",
  "Water Bill Clearance",
  "Assessor's Clearance",
] as const;

const CLOSURE_REQUIRED_DOCUMENTS = [
  "Closure Letter",
  "Barangay Certification",
  "Proof of Ceased Operation",
] as const;

function needsMarketClearance(formData: BusinessInfo): boolean {
  const source = `${formData.lineOfBusiness} ${formData.businessActivity}`.toLowerCase();
  return source.includes("market") || source.includes("stall") || source.includes("wet market");
}

function needsAgricultureClearance(formData: BusinessInfo): boolean {
  const source = `${formData.lineOfBusiness} ${formData.businessActivity}`.toLowerCase();
  return source.includes("agri") || source.includes("agric") || source.includes("farm");
}

function uniqueDocuments(docs: string[]): string[] {
  return Array.from(new Set(docs));
}

export function resolveRequiredDocuments(context: RequiredDocumentContext): string[] {
  const { applicationType, formData } = context;

  if (applicationType === "NEW") {
    return uniqueDocuments([
      ...NEW_BASE_DOCUMENTS,
      ...BUSINESS_TYPE_DOCUMENTS[formData.businessType],
      ...OWNERSHIP_DOCUMENTS[formData.propertyOwnership],
    ]);
  }

  if (applicationType === "RENEWAL") {
    const optionalConditional: string[] = [];
    if (needsMarketClearance(formData)) optionalConditional.push("Market Clearance");
    if (needsAgricultureClearance(formData)) optionalConditional.push("Agriculture Clearance");

    return uniqueDocuments([...RENEWAL_BASE_DOCUMENTS, ...optionalConditional]);
  }

  return [...CLOSURE_REQUIRED_DOCUMENTS];
}

export function getMissingRequiredDocuments(required: string[], uploaded: string[]): string[] {
  const uploadedSet = new Set(uploaded.map((item) => item.trim().toLowerCase()));
  return required.filter((doc) => !uploadedSet.has(doc.trim().toLowerCase()));
}
