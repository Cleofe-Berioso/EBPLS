export type BusinessType =
  | "Sole Proprietorship"
  | "Partnership"
  | "Corporation"
  | "Cooperative";

export type PaymentFrequencyOption = "ANNUAL" | "BI_ANNUAL" | "QUARTERLY";

export type PropertyOwnership = "Owned" | "Not Owned";

export interface FeeLineItemInput {
  id?: string;
  description: string;
  amount: number;
  isSystemGenerated?: boolean;
}

export type ApplicationStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Department Head Review"
  | "Department Head Approved"
  | "Assessed"
  | "Approved for Payment"
  | "Paid"
  | "For Release"
  | "Released"
  | "Revocation Review"
  | "Revoked"
  | "Returned for Correction"
  | "Rejected";

export type ApplicationType = "NEW" | "RENEWAL" | "CLOSURE";

export type PersistMode = "DRAFT" | "SUBMIT";

export const STATUS_FLOW: ApplicationStatus[] = [
  "Draft",
  "Submitted",
  "Under Review",
  "Department Head Review",
  "Department Head Approved",
  "Assessed",
  "Approved for Payment",
  "Paid",
  "For Release",
  "Released",
  "Revocation Review",
  "Revoked",
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
  uploadedAt?: Date | string;
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
  updatedAt?: string;
  canEdit: boolean;
}

export interface BusinessInfo {
  businessType: BusinessType;
  registrationNumber: string;
  paymentFrequency: PaymentFrequencyOption;
  tin: string;
  businessName: string;
  tradeName: string;
  ownerName: string;
  sex?: string;
  nationality: string;
  email: string;
  phone: string;
  country?: string;
  countryCode?: string;
  province?: string;
  provinceCode?: string;
  cityMunicipality?: string;
  streetAddress?: string;
  mainOfficeCountry?: string;
  mainOfficeCountryCode?: string;
  mainOfficeProvince?: string;
  mainOfficeProvinceCode?: string;
  mainOfficeCityMunicipality?: string;
  mainOfficeStreetAddress?: string;
  mainOfficeBarangay?: string;
  mainOfficeAddress: string;
  businessAddress: string;
  businessLatitude: number | null;
  businessLongitude: number | null;
  businessBarangay?: string;
  businessStreetAddress?: string;
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
  isMarket: boolean;
  isAgriculture: boolean;
  isLiquorOrTobacco?: boolean;
  ownerFirstName?: string;
  ownerMiddleName?: string;
  ownerSurname?: string;
  birthDate?: string;
  ownerAge?: string;
  capitalInvestment?: string;
  grossProfit?: string;
  barangay?: string;
  businessOperationType?: "Main" | "Branch";
}
