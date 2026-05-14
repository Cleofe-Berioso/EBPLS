import type { ApplicationType, BusinessInfo, BusinessType } from "@/lib/applicant-types";
import { buildMainOfficeAddress } from "@/lib/address-options";

const REGISTRATION_NUMBER_REGEX_BY_BUSINESS_TYPE: Record<BusinessType, RegExp> = {
  "Sole Proprietorship": /^DTI-\d{4}-\d{6}$/,
  Partnership: /^CS\d{4}-\d{5}$/,
  Corporation: /^CS\d{4}-\d{5}$/,
  Cooperative: /^CDA-\d{4}-\d{6}$/,
};

const TIN_REGEX = /^\d{9}$/;

export const REGISTRATION_METADATA: Record<
  BusinessType,
  {
    label: string;
    agency: string;
    helperText: string;
  }
> = {
  "Sole Proprietorship": {
    label: "DTI Registration Number",
    agency: "Department of Trade and Industry",
    helperText: "Use DTI-YYYY-NNNNNN format (example: DTI-2026-123456).",
  },
  Partnership: {
    label: "SEC Registration Number",
    agency: "Securities and Exchange Commission",
    helperText: "Use CSYYYY-NNNNN format (example: CS2026-12345).",
  },
  Corporation: {
    label: "SEC Registration Number",
    agency: "Securities and Exchange Commission",
    helperText: "Use CSYYYY-NNNNN format (example: CS2026-12345).",
  },
  Cooperative: {
    label: "CDA Registration Number",
    agency: "Cooperative Development Authority",
    helperText: "Use CDA-YYYY-NNNNNN format (example: CDA-2026-123456).",
  },
};

export const RENEWAL_LOCKED_FIELDS: Array<keyof BusinessInfo> = [
  "businessName",
  "businessType",
  "registrationNumber",
  "tin",
  "ownerName",
  "tradeName",
  "nationality",
];

export function getRegistrationLabel(businessType: BusinessType): string {
  return REGISTRATION_METADATA[businessType].label;
}

export function getRegistrationAgency(businessType: BusinessType): string {
  return REGISTRATION_METADATA[businessType].agency;
}

export function getRegistrationHelperText(businessType: BusinessType): string {
  return REGISTRATION_METADATA[businessType].helperText;
}

export function validateRegistrationNumberFormat(
  businessType: BusinessType,
  registrationNumber: string
): boolean {
  return REGISTRATION_NUMBER_REGEX_BY_BUSINESS_TYPE[businessType].test(registrationNumber.trim());
}

export function validateTinFormat(tin: string): boolean {
  return TIN_REGEX.test(tin.trim());
}

export function validateBusinessIdentityFormats(input: Pick<BusinessInfo, "businessType" | "registrationNumber" | "tin">): {
  registrationNumber: boolean;
  tin: boolean;
} {
  return {
    registrationNumber: validateRegistrationNumberFormat(input.businessType, input.registrationNumber),
    tin: validateTinFormat(input.tin),
  };
}

export function isCorporation(businessType: BusinessType): boolean {
  return businessType === "Corporation";
}

export const CORPORATION_OWNERSHIP_CLASSIFICATIONS = [
  "Filipino-owned",
  "Foreign-owned",
  "Mixed Filipino-Foreign ownership",
] as const;

export function isCorporationOwnershipClassification(value: string): boolean {
  return (CORPORATION_OWNERSHIP_CLASSIFICATIONS as readonly string[]).includes(value);
}

export function resolveNationalityOnBusinessTypeChange(
  previousBusinessType: BusinessType,
  nextBusinessType: BusinessType,
  currentNationality: string
): string {
  const trimmedNationality = currentNationality.trim();

  if (isCorporation(nextBusinessType)) {
    if (
      isCorporation(previousBusinessType) &&
      isCorporationOwnershipClassification(trimmedNationality)
    ) {
      return trimmedNationality;
    }

    return "";
  }

  return "Filipino";
}

export function normalizeNationality(businessType: BusinessType, nationality: string): string {
  const normalized = nationality.trim();
  if (!isCorporation(businessType)) {
    return normalized.length > 0 ? normalized : "Filipino";
  }

  return normalized;
}

export function normalizeBusinessInfo(input: BusinessInfo): BusinessInfo {
  const country = input.country?.trim() ?? "";
  const countryCode = input.countryCode?.trim() ?? "";
  const province = input.province?.trim() ?? "";
  const provinceCode = input.provinceCode?.trim() ?? "";
  const cityMunicipality = input.cityMunicipality?.trim() ?? "";
  const streetAddress = input.streetAddress?.trim() ?? "";
  const hasStructuredAddress = [country, province, cityMunicipality, streetAddress].some(
    (value) => value.length > 0
  );

  const normalizedMainOfficeAddress = hasStructuredAddress
    ? buildMainOfficeAddress({
        streetAddress,
        cityMunicipality,
        province,
        country,
      })
    : input.mainOfficeAddress.trim();

  return {
    ...input,
    registrationNumber: input.registrationNumber.trim(),
    tin: input.tin.trim(),
    businessName: input.businessName.trim(),
    tradeName: input.tradeName.trim(),
    ownerName: input.ownerName.trim(),
    sex: input.sex?.trim(),
    nationality: normalizeNationality(input.businessType, input.nationality),
    email: input.email.trim(),
    phone: input.phone.trim(),
    country,
    countryCode,
    province,
    provinceCode,
    cityMunicipality,
    streetAddress,
    mainOfficeAddress: normalizedMainOfficeAddress,
    businessAddress: input.businessAddress.trim(),
    businessLatitude:
      typeof input.businessLatitude === "number" && Number.isFinite(input.businessLatitude)
        ? input.businessLatitude
        : null,
    businessLongitude:
      typeof input.businessLongitude === "number" && Number.isFinite(input.businessLongitude)
        ? input.businessLongitude
        : null,
    taxDeclarationNumber: input.taxDeclarationNumber.trim(),
    propertyIdentificationNumber: input.propertyIdentificationNumber.trim(),
    taxIncentives: input.taxIncentives.trim(),
    businessActivity: input.businessActivity.trim(),
    lineOfBusiness: input.lineOfBusiness.trim(),
    assetSize: input.assetSize.trim(),
    businessArea: input.businessArea.trim(),
    totalFloorArea: input.totalFloorArea.trim(),
    totalEmployees: input.totalEmployees.trim(),
    maleEmployees: input.maleEmployees.trim(),
    femaleEmployees: input.femaleEmployees.trim(),
    employeesWithinMunicipality: input.employeesWithinMunicipality.trim(),
    deliveryVehicles: input.deliveryVehicles.trim(),
    isMarket: Boolean(input.isMarket),
    isAgriculture: Boolean(input.isAgriculture),
    isLiquorOrTobacco: Boolean(input.isLiquorOrTobacco),
  };
}

export function applyLockedBusinessFields(
  applicationType: ApplicationType,
  candidate: BusinessInfo,
  source?: BusinessInfo | null
): BusinessInfo {
  const normalizedCandidate = normalizeBusinessInfo(candidate);
  if (applicationType !== "RENEWAL" || !source) {
    return normalizedCandidate;
  }

  const normalizedSource = normalizeBusinessInfo(source);
  const merged = { ...normalizedCandidate };

  for (const field of RENEWAL_LOCKED_FIELDS) {
    merged[field] = normalizedSource[field] as never;
  }

  return normalizeBusinessInfo(merged);
}