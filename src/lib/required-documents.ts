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
  "One Person Corporation": ["SEC Certificate"],
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

const DOCUMENT_DESCRIPTIONS: Record<string, string> = {
  "location plan / sketch":
    "Sketch or plan showing the business location and site layout for zoning and engineering review.",
  "zoning clearance":
    "Certification that the business location complies with local zoning regulations.",
  "sanitary clearance":
    "Health and sanitation clearance from the municipal sanitary office.",
  "sanitary office clearance":
    "Health and sanitation clearance from the municipal sanitary office.",
  "environment clearance":
    "Environmental compliance clearance from the municipal environment office.",
  "environment office clearance":
    "Environmental compliance clearance from the municipal environment office.",
  "engineering clearance":
    "Structural or building-related clearance from the municipal engineering office.",
  "engineering office clearance":
    "Structural or building-related clearance from the municipal engineering office.",
  "bfp clearance":
    "Fire safety inspection clearance from the Bureau of Fire Protection.",
  "real property tax / rpt clearance":
    "Proof of real property tax compliance for the business premises.",
  "rpt clearance":
    "Proof of real property tax compliance for the business premises.",
  "water bill clearance":
    "Proof of water utility account or clearance for the business premises.",
  "assessor's office clearance":
    "Property assessment clearance from the municipal assessor's office.",
  "dti certificate":
    "DTI registration certificate for sole proprietorship businesses.",
  "sec certificate":
    "SEC registration certificate for corporations, partnerships, or one person corporations.",
  "cda certificate":
    "CDA registration certificate for cooperative businesses.",
  "transfer certificate of title or tax declaration (certified true copy, 1 copy)":
    "Proof of property ownership through title or tax declaration.",
  "contract of lease or moa or written consent (certified true copy, 1 copy)":
    "Proof of authorization to use the business premises when property is not owned.",
  "market clearance":
    "Clearance for businesses operating inside a public market or market stall.",
  "agriculture clearance":
    "Department of Agriculture clearance for agriculture-related businesses.",
  "audited financial statement or unaudited afs if not required by bir":
    "Latest financial statement required for renewal assessment.",
  "sworn declaration of gross sales / income tax return":
    "Declared gross sales or income tax return for renewal fee computation.",
  "closure letter":
    "Formal letter requesting business closure.",
  "barangay certification":
    "Barangay certification supporting the closure request.",
  "proof of ceased operation":
    "Evidence that business operations have ceased.",
};

export function getDocumentRequirementDescription(documentName: string): string {
  const normalized = normalizeDocumentName(documentName);
  return (
    DOCUMENT_DESCRIPTIONS[normalized] ??
    "Supporting document required for application review. Upload a clear and readable copy."
  );
}
