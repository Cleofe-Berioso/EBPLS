import type { ApplicationType, BusinessInfo } from "@/lib/applicant-types";

interface RequiredDocumentContext {
  applicationType: ApplicationType;
  formData: BusinessInfo;
}

const NEW_BASE_DOCUMENTS = [
  "Location Plan / Sketch",
  "Zoning Clearance",
  "Sanitary Clearance",
  "Environment Clearance",
  "Engineering Clearance",
  "BFP Clearance",
  "Real Property Tax / RPT Clearance",
  "Water Bill Clearance",
  "Assessor's Office Clearance",
] as const;

const BUSINESS_TYPE_DOCUMENTS: Record<BusinessInfo["businessType"], string[]> = {
  "Sole Proprietorship": ["DTI Certificate"],
  Partnership: ["SEC Certificate"],
  Corporation: ["SEC Certificate"],
  Cooperative: ["CDA Certificate"],
};

const OWNERSHIP_DOCUMENTS: Record<BusinessInfo["propertyOwnership"], string[]> = {
  Owned: ["Transfer Certificate of Title OR Tax Declaration (Certified True Copy, 1 copy)"],
  "Not Owned": ["Contract of Lease OR MOA OR Written Consent (Certified True Copy, 1 copy)"],
};

const RENEWAL_BASE_DOCUMENTS = [
  "Audited Financial Statement OR Unaudited AFS if not required by BIR",
  "Sworn Declaration of Gross Sales / Income Tax Return",
  "Sanitary Office Clearance",
  "Environment Office Clearance",
  "Engineering Office Clearance",
  "BFP Clearance",
  "RPT Clearance",
  "Water Bill Clearance",
  "Assessor's Office Clearance",
] as const;

const CLOSURE_REQUIRED_DOCUMENTS = [
  "Closure Letter",
  "Barangay Certification",
  "Proof of Ceased Operation",
] as const;

function uniqueDocuments(docs: string[]): string[] {
  return Array.from(new Set(docs));
}

function getConditionalDocuments(formData: BusinessInfo): string[] {
  const conditional: string[] = [];

  if (formData.isMarket) {
    conditional.push("Market Clearance");
  }

  if (formData.isAgriculture) {
    conditional.push("Agriculture Clearance");
  }

  return conditional;
}

export function resolveRequiredDocuments(context: RequiredDocumentContext): string[] {
  const { applicationType, formData } = context;
  const conditionalDocuments = getConditionalDocuments(formData);

  if (applicationType === "NEW") {
    return uniqueDocuments([
      ...NEW_BASE_DOCUMENTS,
      ...BUSINESS_TYPE_DOCUMENTS[formData.businessType],
      ...OWNERSHIP_DOCUMENTS[formData.propertyOwnership],
      ...conditionalDocuments,
    ]);
  }

  if (applicationType === "RENEWAL") {
    return uniqueDocuments([...RENEWAL_BASE_DOCUMENTS, ...conditionalDocuments]);
  }

  return uniqueDocuments([...CLOSURE_REQUIRED_DOCUMENTS]);
}

export function normalizeDocumentName(name: string): string {
  const normalized = name.trim().toLowerCase();

  const aliases: Record<string, string> = {
    "da clearance": "agriculture clearance",
    "fire safety clearance": "bfp clearance",
    "dti registration certificate": "dti certificate",
    "sec registration certificate": "sec certificate",
    "cda registration certificate": "cda certificate",
    "location sketch / plan": "location plan / sketch",
    "rpt clearance": "real property tax / rpt clearance",
    "assessor's clearance": "assessor's office clearance",
    "sworn declaration of gross sales / receipts": "sworn declaration of gross sales / income tax return",
    "financial statement (audited afs or unaudited afs)": "audited financial statement or unaudited afs if not required by bir",
    "sanitary clearance": "sanitary office clearance",
    "environment clearance": "environment office clearance",
    "engineering clearance": "engineering office clearance",
    "proof of property ownership (transfer certificate of title or tax declaration)": "transfer certificate of title or tax declaration (certified true copy, 1 copy)",
    "proof of property use authorization (contract of lease, moa, or written consent)": "contract of lease or moa or written consent (certified true copy, 1 copy)",
  };

  return aliases[normalized] ?? normalized;
}

export function getMissingRequiredDocuments(required: string[], uploaded: string[]): string[] {
  const uploadedSet = new Set(uploaded.map((item) => normalizeDocumentName(item)));
  return required.filter((doc) => !uploadedSet.has(normalizeDocumentName(doc)));
}
