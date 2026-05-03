export type BusinessType =
  | "Sole Proprietorship"
  | "One Person Corporation"
  | "Partnership"
  | "Corporation"
  | "Cooperative";

export type PropertyOwnership = "Owned" | "Not Owned";

export type ApplicationStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Assessed"
  | "Approved for Payment"
  | "Paid"
  | "For Release"
  | "Released"
  | "Returned for Correction"
  | "Rejected";

export type ApplicationType = "NEW" | "RENEWAL" | "CLOSURE";

export type PersistMode = "DRAFT" | "SUBMIT";

export const STATUS_FLOW: ApplicationStatus[] = [
  "Draft",
  "Submitted",
  "Under Review",
  "Assessed",
  "Approved for Payment",
  "Paid",
  "For Release",
  "Released",
  "Returned for Correction",
  "Rejected",
];

export interface ApplicationDocumentInput {
  id?: string;
  documentName: string;
  fileName: string;
  storagePath?: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface SubmitValidationErrorDetail {
  missingFields: string[];
  missingDocuments: string[];
}

export interface SaveApplicationInput {
  applicationId?: string;
  applicationType: ApplicationType;
  businessRecordId?: string;
  formData: BusinessInfo;
  documents: ApplicationDocumentInput[];
  mode: PersistMode;
}

export interface ApplicantApplicationRow {
  id: string;
  applicationNumber: string;
  businessName: string;
  applicationType: ApplicationType;
  status: ApplicationStatus;
  dateSubmitted: string;
  canEdit: boolean;
}

export interface BusinessInfo {
  businessType: BusinessType;
  registrationNumber: string;
  tin: string;
  businessName: string;
  tradeName: string;
  ownerName: string;
  nationality: string;
  email: string;
  phone: string;
  mainOfficeAddress: string;
  businessAddress: string;
  sameAsMainOffice: boolean;
  businessArea: string;
  totalFloorArea: string;
  totalEmployees: string;
  maleEmployees: string;
  femaleEmployees: string;
  employeesWithinMunicipality: string;
  deliveryVehicles: string;
  propertyOwnership: PropertyOwnership;
  taxDeclarationNumber: string;
  propertyIdentificationNumber: string;
  taxIncentives: string;
  businessActivity: string;
  lineOfBusiness: string;
  assetSize: string;
}
