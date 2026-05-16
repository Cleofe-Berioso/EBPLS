import type { ApplicationType, BusinessInfo, BusinessType } from "@/lib/applicant-types";
import {
  buildEbMagalonaBusinessAddress,
  buildMainOfficeAddress,
  EB_MAGALONA_CITY,
  EB_MAGALONA_COUNTRY,
  EB_MAGALONA_COUNTRY_CODE,
  EB_MAGALONA_PROVINCE,
  isPhilippinesCountry,
} from "@/lib/address-options";

export { isPhilippinesCountry } from "@/lib/address-options";

export const EB_MAGALONA_BARANGAYS = [
  "Aurel",
  "Barangay 1 (Pob.)",
  "Barangay 2 (Pob.)",
  "Barangay 3 (Pob.)",
  "Barangay 4 (Pob.)",
  "Barangay 5 (Pob.)",
  "Barangay 6 (Pob.)",
  "Barangay 7 (Pob.)",
  "Caidiocan",
  "Calampisawan",
  "Canmoros",
  "Guinguinabang",
  "Ilijan",
  "Mangiliol",
  "Matagoy",
  "Motherchurch",
  "Nayon",
  "Quinagaringan",
  "Suba",
  "Talabaan",
] as const;

export const BUSINESS_ACTIVITY_OPTIONS = [
  "Retail",
  "Services",
  "Manufacturing",
  "Food and Beverage",
  "Agriculture",
  "Market Stall",
  "Other",
] as const;

function parseBirthDateInput(value: string | Date): Date {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) {
      throw new Error("Birthdate is invalid.");
    }
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("Birthdate is required.");
  }

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      throw new Error("Birthdate is invalid.");
    }
    return parsed;
  }

  const parsed = new Date(trimmed);
  if (!Number.isFinite(parsed.getTime())) {
    throw new Error("Birthdate is invalid.");
  }
  return parsed;
}

export function calculateAgeFromBirthDate(birthDate: string | Date, now = new Date()): number {
  const parsedBirthDate = parseBirthDateInput(birthDate);
  const birth = new Date(
    Date.UTC(
      parsedBirthDate.getUTCFullYear(),
      parsedBirthDate.getUTCMonth(),
      parsedBirthDate.getUTCDate(),
      12,
      0,
      0
    )
  );

  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0));

  if (birth.getTime() > today.getTime()) {
    throw new Error("Birthdate cannot be in the future.");
  }

  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const hasHadBirthdayThisYear =
    today.getUTCMonth() > birth.getUTCMonth() ||
    (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() >= birth.getUTCDate());

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  if (!Number.isInteger(age) || age < 0 || age > 120) {
    throw new Error("Computed age is out of allowed range.");
  }

  return age;
}

export function splitOwnerName(ownerName: string): {
  ownerFirstName: string;
  ownerMiddleName: string;
  ownerSurname: string;
} {
  const trimmed = ownerName.trim();
  if (!trimmed) return { ownerFirstName: "", ownerMiddleName: "", ownerSurname: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { ownerFirstName: parts[0] ?? "", ownerMiddleName: "", ownerSurname: "" };
  }
  if (parts.length === 2) {
    return { ownerFirstName: parts[0] ?? "", ownerMiddleName: "", ownerSurname: parts[1] ?? "" };
  }
  return {
    ownerFirstName: parts[0] ?? "",
    ownerMiddleName: parts.slice(1, -1).join(" "),
    ownerSurname: parts[parts.length - 1] ?? "",
  };
}

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

  return trimmedNationality;
}

export function normalizeNationality(businessType: BusinessType, nationality: string): string {
  return nationality.trim();
}

export function normalizeBusinessInfo(input: BusinessInfo): BusinessInfo {
  const country = EB_MAGALONA_COUNTRY;
  const countryCode = EB_MAGALONA_COUNTRY_CODE;
  const province = EB_MAGALONA_PROVINCE;
  const provinceCode = input.provinceCode?.trim() ?? "";
  const cityMunicipality = EB_MAGALONA_CITY;

  const legacyMainOfficeAddressParts = (input.mainOfficeAddress?.trim() ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
    const mainOfficeCountry = input.mainOfficeCountry?.trim() || "";
    const mainOfficeCountryCode = input.mainOfficeCountryCode?.trim().toUpperCase() || "";
    const mainOfficeProvince = input.mainOfficeProvince?.trim() || "";
    const mainOfficeProvinceCode = input.mainOfficeProvinceCode?.trim() || "";
    const mainOfficeCityMunicipality = input.mainOfficeCityMunicipality?.trim() || "";
    const mainOfficePhilippines = isPhilippinesCountry(mainOfficeCountry, mainOfficeCountryCode);
    const mainOfficeStreetAddress = mainOfficePhilippines ? "" : (input.mainOfficeStreetAddress?.trim() || "");
    const mainOfficeBarangay = mainOfficePhilippines ? (input.mainOfficeBarangay?.trim() || "") : "";

  const rawStreetAddress = input.streetAddress?.trim() ?? "";
  const rawBarangay = input.barangay?.trim() ?? "";
  const legacyBusinessAddress = input.businessAddress?.trim() ?? "";

  const legacyParts = legacyBusinessAddress.split(",").map((part) => part.trim()).filter(Boolean);
  const inferredStreet = !rawStreetAddress && legacyParts.length > 0 ? legacyParts[0] ?? "" : "";
  const inferredBarangay = !rawBarangay && legacyParts.length > 1
    ? (legacyParts[1] ?? "").replace(/^barangay\s+/i, "")
    : "";

  const streetAddress = (rawStreetAddress || inferredStreet).trim();
  const barangay = (rawBarangay || inferredBarangay).trim();
  const birthDate = input.birthDate?.trim() ?? "";
  const hasStructuredMainOfficeAddress = [
    mainOfficeCountry,
    mainOfficeProvince,
    mainOfficeCityMunicipality,
    mainOfficePhilippines ? mainOfficeBarangay : mainOfficeStreetAddress,
  ].some((value) => value.length > 0);

  const normalizedMainOfficeAddress = hasStructuredMainOfficeAddress
    ? mainOfficePhilippines
      ? [mainOfficeBarangay, mainOfficeCityMunicipality, mainOfficeProvince, mainOfficeCountry]
          .filter((part) => part.trim().length > 0)
          .join(", ")
      : buildMainOfficeAddress({
          streetAddress: mainOfficeStreetAddress,
          barangay: mainOfficeBarangay,
          cityMunicipality: mainOfficeCityMunicipality,
          province: mainOfficeProvince,
          country: mainOfficeCountry,
          countryCode: mainOfficeCountryCode,
        })
    : input.mainOfficeAddress.trim();

  const philippines = isPhilippinesCountry(country, countryCode);

  // Auto-split ownerName into parts when both split fields are empty (e.g. loading an old record).
  let ownerFirstName = input.ownerFirstName?.trim() ?? "";
  let ownerMiddleName = input.ownerMiddleName?.trim() ?? "";
  let ownerSurname = input.ownerSurname?.trim() ?? "";
  if (!ownerFirstName && !ownerSurname && input.ownerName.trim()) {
    const split = splitOwnerName(input.ownerName);
    ownerFirstName = split.ownerFirstName;
    ownerMiddleName = split.ownerMiddleName;
    ownerSurname = split.ownerSurname;
  }
  const combinedOwnerName =
    [ownerFirstName, ownerMiddleName, ownerSurname].filter(Boolean).join(" ") ||
    input.ownerName.trim();

  let ownerAge = input.ownerAge?.trim() ?? "";
  if (birthDate.length > 0) {
    try {
      ownerAge = String(calculateAgeFromBirthDate(birthDate));
    } catch {
      ownerAge = "";
    }
  }

  return {
    ...input,
    registrationNumber: input.registrationNumber.trim(),
    tin: input.tin.trim(),
    businessName: input.businessName.trim(),
    tradeName: input.tradeName.trim(),
    ownerName: combinedOwnerName,
    ownerFirstName,
    ownerMiddleName,
    ownerSurname,
    birthDate,
    ownerAge,
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
    barangay: philippines ? barangay : "",
    mainOfficeCountry,
    mainOfficeCountryCode,
    mainOfficeProvince,
    mainOfficeProvinceCode,
    mainOfficeCityMunicipality,
    mainOfficeStreetAddress,
    mainOfficeBarangay,
    mainOfficeAddress: normalizedMainOfficeAddress,
    businessAddress: buildEbMagalonaBusinessAddress({ streetAddress, barangay }),
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
    capitalInvestment: input.capitalInvestment?.trim() ?? "",
    grossProfit: input.grossProfit?.trim() ?? "",
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
    businessOperationType: input.businessOperationType ?? "Main",
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