"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { defaultBusinessInfo } from "@/lib/applicant-mock";
import { normalizeBusinessInfo as normalizeBusinessInfoRules } from "@/lib/business-rules";
import {
  calculateAgeFromBirthDate,
  isCorporation,
  isCorporationOwnershipClassification,
  isPhilippinesCountry,
  validateBusinessIdentityFormats,
  BUSINESS_ACTIVITY_OPTIONS,
} from "@/lib/business-rules";
import {
  EB_MAGALONA_CITY,
  EB_MAGALONA_COUNTRY,
  EB_MAGALONA_COUNTRY_CODE,
  EB_MAGALONA_PROVINCE,
  isEbMagalonaCity,
  isEbMagalonaProvince,
} from "@/lib/address-options";
import { isWithinEbMagalona } from "@/lib/business-location";
import type {
  ApplicationDocumentInput,
  BusinessInfo,
  PersistMode,
  PropertyOwnership,
  SaveApplicationInput,
} from "@/lib/applicant-types";
import {
  getMissingRequiredDocuments,
  normalizeDocumentName,
  resolveRequiredDocuments,
} from "@/lib/required-documents";
import { LINE_OF_BUSINESS_OPTIONS } from "@/lib/business-options";
import { BusinessInformationFields } from "./business-information-fields";
import { FormStepper } from "@/components/applicant/form-stepper";
import { UploadSlot } from "@/components/applicant/upload-slot";
import { actionButtonStyles } from "@/components/ui/action-button";
import { FormField } from "@/components/ui/form-field";
import { InfoBanner } from "@/components/ui/info-banner";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SectionCard } from "@/components/ui/section-card";

const steps = [
  {
    title: "Business Information",
    description: "Enter core business identity and contact details.",
  },
  {
    title: "Business Operation",
    description: "Provide operational, staffing, and property details.",
  },
  {
    title: "Document Upload",
    description: "Upload all required clearances and supporting files.",
  },
  {
    title: "Assessment Notice",
    description: "Final fees are assessed by BPLO after application review.",
  },
  {
    title: "Review and Submit",
    description: "Check completeness, then save draft or submit.",
  },
];

const operationFields: Array<{
  label: string;
  key: keyof BusinessInfo;
  helperText?: string;
}> = [
  { label: "Business Area", key: "businessArea", helperText: "Use the declared operating area." },
  { label: "Total Floor Area", key: "totalFloorArea" },
  { label: "Total Employees", key: "totalEmployees" },
  { label: "Male Employees", key: "maleEmployees" },
  { label: "Female Employees", key: "femaleEmployees" },
  {
    label: "Employees Residing within Municipality",
    key: "employeesWithinMunicipality",
  },
  { label: "Delivery Vehicles", key: "deliveryVehicles" },
  { label: "Asset Size", key: "assetSize", helperText: "Use the declared amount in pesos." },
];

// taxIncentives removed from applicant form (field preserved in DB / type for existing records and BPLO display)

const LINE_OF_BUSINESS_SELECT_OPTIONS = LINE_OF_BUSINESS_OPTIONS.map((option) => ({
  value: option,
  label: option,
  name: option,
}));

const FIELD_LABELS: Partial<Record<keyof BusinessInfo, string>> = {
  businessType: "Business Type",
  registrationNumber: "Registration Number",
  tin: "TIN",
  businessName: "Business Name",
  tradeName: "Trade Name",
  ownerName: "Owner / President Name",
  ownerFirstName: "First Name",
  ownerSurname: "Surname",
  birthDate: "Birthdate",
  ownerAge: "Owner Age",
  capitalInvestment: "Capital Investment",
  barangay: "Barangay",
  businessOperationType: "Business Office Type",
  nationality: "Nationality",
  email: "Email",
  phone: "Contact Number",
  country: "Country",
  countryCode: "Country Code",
  province: "Province",
  provinceCode: "Province Code",
  cityMunicipality: "City / Municipality",
  streetAddress: "Street Address",
  mainOfficeCountry: "Main Office Country",
  mainOfficeCountryCode: "Main Office Country Code",
  mainOfficeProvince: "Main Office Province / State",
  mainOfficeProvinceCode: "Main Office Province / State Code",
  mainOfficeCityMunicipality: "Main Office City / Municipality",
  mainOfficeStreetAddress: "Main Office Street / Address Line",
  mainOfficeBarangay: "Main Office Barangay",
  mainOfficeAddress: "Main Office Address",
  businessAddress: "Business Address",
  businessBarangay: "Business Barangay",
  businessStreetAddress: "Business Street / Purok / Building / Unit",
  businessLatitude: "Business Location Latitude",
  businessLongitude: "Business Location Longitude",
  businessArea: "Business Area",
  totalFloorArea: "Total Floor Area",
  totalEmployees: "Total Employees",
  maleEmployees: "Male Employees",
  femaleEmployees: "Female Employees",
  employeesWithinMunicipality: "Employees Residing within Municipality",
  deliveryVehicles: "Delivery Vehicles",
  businessActivity: "Business Activity",
  lineOfBusiness: "Line of Business",
  assetSize: "Asset Size",
  taxDeclarationNumber: "Tax Declaration Number",
  propertyIdentificationNumber: "Property Identification Number",
};

const BUSINESS_LOCATION_ERROR = "Please pin the business location inside EB Magalona.";

const STEP_REQUIRED_FIELDS: Record<number, Array<keyof BusinessInfo>> = {
  0: [
    "businessType",
    "registrationNumber",
    "tin",
    "businessName",
    "ownerFirstName",
    "ownerSurname",
    "birthDate",
    "capitalInvestment",
    "nationality",
    "email",
    "phone",
    "mainOfficeCountry",
    "mainOfficeProvince",
    "mainOfficeCityMunicipality",
    "mainOfficeAddress",
    "businessLatitude",
    "businessLongitude",
    "businessAddress",
    "businessBarangay",
    "businessStreetAddress",
  ],
  1: [
    "businessArea",
    "totalFloorArea",
    "totalEmployees",
    "maleEmployees",
    "femaleEmployees",
    "employeesWithinMunicipality",
    "deliveryVehicles",
    "businessActivity",
    "lineOfBusiness",
    "assetSize",
  ],
};

function normalizeBusinessInfo(next: BusinessInfo): BusinessInfo {
  return normalizeBusinessInfoRules(next);
}

function validateBusinessLocation(info: BusinessInfo): Partial<Record<keyof BusinessInfo, string>> {
  const nextErrors: Partial<Record<keyof BusinessInfo, string>> = {};

  if (info.businessLatitude == null || info.businessLongitude == null) {
    nextErrors.businessLatitude = BUSINESS_LOCATION_ERROR;
    return nextErrors;
  }

  if (!isWithinEbMagalona(info.businessLatitude, info.businessLongitude)) {
    nextErrors.businessLatitude = BUSINESS_LOCATION_ERROR;
  }

  return nextErrors;
}

function requiresBarangay(info: BusinessInfo): boolean {
  return isPhilippinesCountry(info.mainOfficeCountry, info.mainOfficeCountryCode);
}

function validateFixedEbMagalonaAddress(info: BusinessInfo): Partial<Record<keyof BusinessInfo, string>> {
  const nextErrors: Partial<Record<keyof BusinessInfo, string>> = {};

  if (info.country.trim() !== EB_MAGALONA_COUNTRY) {
    nextErrors.country = `Business country must be fixed to ${EB_MAGALONA_COUNTRY}.`;
  }

  if ((info.countryCode ?? "").trim().toUpperCase() !== EB_MAGALONA_COUNTRY_CODE) {
    nextErrors.countryCode = `Country code must be ${EB_MAGALONA_COUNTRY_CODE}.`;
  }

  if (!isEbMagalonaProvince(info.province)) {
    nextErrors.province = `Business province must be ${EB_MAGALONA_PROVINCE}.`;
  }

  if (!isEbMagalonaCity(info.cityMunicipality)) {
    nextErrors.cityMunicipality = `Business city/municipality must be ${EB_MAGALONA_CITY}.`;
  }

  if (!info.streetAddress?.trim()) {
    nextErrors.streetAddress = "Street Address is required.";
  }

  if (!info.barangay?.trim()) {
    nextErrors.barangay = "Select a barangay for EB Magalona.";
  }

  if (!info.businessAddress?.trim()) {
    nextErrors.businessAddress = "Business Address is required.";
  }

  return nextErrors;
}

function parsePositiveAmount(value: string): number | null {
  const normalized = value.replace(/[,\s]/g, "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function ReviewStat({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function FieldCard({
  label,
  value,
  onChange,
  onBlur,
  helperText,
  error,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  helperText?: string;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <FormField label={label} required hint={helperText} error={error}>
      <input
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
        value={value}
        disabled={disabled}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  );
}

const READ_ONLY_LOCKED_FIELDS: Array<keyof BusinessInfo> = [
  "businessType",
  "registrationNumber",
  "tin",
  "businessName",
  "tradeName",
  "ownerName",
  "ownerFirstName",
  "ownerMiddleName",
  "ownerSurname",
  "birthDate",
  "ownerAge",
  "sex",
  "nationality",
  "email",
  "phone",
  "mainOfficeCountry",
  "mainOfficeCountryCode",
  "mainOfficeProvince",
  "mainOfficeProvinceCode",
  "mainOfficeCityMunicipality",
  "mainOfficeStreetAddress",
  "mainOfficeBarangay",
  "mainOfficeAddress",
  "businessAddress",
  "businessBarangay",
  "businessStreetAddress",
  "businessLatitude",
  "businessLongitude",
  "businessArea",
  "totalFloorArea",
  "totalEmployees",
  "maleEmployees",
  "femaleEmployees",
  "employeesWithinMunicipality",
  "deliveryVehicles",
  "businessActivity",
  "lineOfBusiness",
  "assetSize",
  "propertyOwnership",
  "taxDeclarationNumber",
  "propertyIdentificationNumber",
  "capitalInvestment",
  "paymentFrequency",
  "isMarket",
  "isAgriculture",
  "isLiquorOrTobacco",
];

export function NewApplicationForm() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("applicationId");

  const [step, setStep] = useState(0);
  const [info, setInfo] = useState<BusinessInfo>(defaultBusinessInfo);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, ApplicationDocumentInput>>({});
  const [pendingDocuments, setPendingDocuments] = useState<Record<string, File>>({});
  const [applicationId, setApplicationId] = useState<string | undefined>(editId ?? undefined);
  const [statusMessage, setStatusMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [missingDocNames, setMissingDocNames] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof BusinessInfo, string>>>({});
  const [existingApplicationAccess, setExistingApplicationAccess] = useState<{
    canEdit: boolean;
    status: string;
  } | null>(null);

  const isReadOnly = Boolean(editId && existingApplicationAccess && !existingApplicationAccess.canEdit);
  const lockInteractivityClass = isReadOnly ? "pointer-events-none" : "";

  useEffect(() => {
    const normalizedInfo = normalizeBusinessInfo(info);
    const identityFormats = validateBusinessIdentityFormats(normalizedInfo);

    setFieldErrors((current) => {
      const nextErrors = { ...current };

      if (normalizedInfo.registrationNumber.trim().length > 0 && !identityFormats.registrationNumber) {
        nextErrors.registrationNumber = "Wrong Format";
      } else if (nextErrors.registrationNumber === "Wrong Format" || nextErrors.registrationNumber === "This already exist") {
        delete nextErrors.registrationNumber;
      }

      if (normalizedInfo.tin.trim().length > 0 && !identityFormats.tin) {
        nextErrors.tin = "Wrong Format";
      } else if (nextErrors.tin === "Wrong Format" || nextErrors.tin === "This already exist") {
        delete nextErrors.tin;
      }

      return nextErrors;
    });
  }, [info]);

  const requiredDocs = useMemo(
    () =>
      resolveRequiredDocuments({
        applicationType: "NEW",
        formData: info,
      }),
    [info]
  );

  const getUploadedDocumentForRequiredName = (requiredName: string) =>
    Object.values(uploadedDocuments).find(
      (doc) => normalizeDocumentName(doc.documentName) === normalizeDocumentName(requiredName)
    );

  const uploadedRequiredCount = requiredDocs.filter((doc) => getUploadedDocumentForRequiredName(doc)).length;

  useEffect(() => {
    let active = true;

    async function loadExistingApplication() {
      if (!editId) return;

      const response = await fetch(`/api/applicant/applications/${editId}`, { cache: "no-store" });
      const data = (await response.json()) as {
        application?: {
          id: string;
          status: string;
          canEdit: boolean;
          formData: BusinessInfo;
          documents: ApplicationDocumentInput[];
        };
      };

      if (!active || !response.ok || !data.application) return;

      setApplicationId(data.application.id);
      setExistingApplicationAccess({
        canEdit: Boolean(data.application.canEdit),
        status: data.application.status,
      });
      setInfo(
        normalizeBusinessInfo({
          ...defaultBusinessInfo,
          ...data.application.formData,
          paymentFrequency: data.application.formData.paymentFrequency ?? "ANNUAL",
        })
      );
      setUploadedDocuments(
        data.application.documents.reduce<Record<string, ApplicationDocumentInput>>((acc, doc) => {
          acc[doc.documentName] = doc;
          return acc;
        }, {})
      );
    }

    void loadExistingApplication();
    return () => {
      active = false;
    };
  }, [editId]);

  function applyInfoChange(next: BusinessInfo) {
    if (isReadOnly) return;
    setInfo(normalizeBusinessInfo(next));
  }

  function validateFieldOnBlur(field: keyof BusinessInfo) {
    if (isReadOnly) return;
    const normalizedInfo = normalizeBusinessInfo(info);
    const nextErrors = { ...fieldErrors };
    const value = normalizedInfo[field];
    const philippinesMainOffice = requiresBarangay(normalizedInfo);
    let isRequired = (STEP_REQUIRED_FIELDS[0] ?? []).includes(field) || (STEP_REQUIRED_FIELDS[1] ?? []).includes(field);

    if (field === "mainOfficeBarangay") {
      isRequired = philippinesMainOffice;
    }

    if (field === "mainOfficeStreetAddress") {
      isRequired = !philippinesMainOffice;
    }

    if (isRequired && (typeof value !== "string" || value.trim().length === 0)) {
      if (field === "mainOfficeAddress") {
        nextErrors[field] = philippinesMainOffice
          ? "Fill in Country, Province, City/Municipality, and Barangay to auto-generate."
          : "Fill in Country, Province, City/Municipality, and Street Address to auto-generate.";
      } else if (field === "mainOfficeBarangay") {
        nextErrors[field] = "Select a barangay for the Philippine main office address.";
      } else if (field === "mainOfficeStreetAddress") {
        nextErrors[field] = "Street Address is required for non-Philippine main office addresses.";
      } else {
        nextErrors[field] = `${FIELD_LABELS[field] ?? field} is required.`;
      }
    } else if (nextErrors[field] !== "This already exist") {
      delete nextErrors[field];
    }

    if (field === "registrationNumber" && normalizedInfo.registrationNumber.trim().length > 0) {
      const valid = validateBusinessIdentityFormats(normalizedInfo).registrationNumber;
      if (!valid) nextErrors.registrationNumber = "Wrong Format";
    }

    if (field === "tin" && normalizedInfo.tin.trim().length > 0) {
      const valid = validateBusinessIdentityFormats(normalizedInfo).tin;
      if (!valid) nextErrors.tin = "Wrong Format";
    }

    if (field === "mainOfficeBarangay") {
      if (philippinesMainOffice && !normalizedInfo.mainOfficeBarangay?.trim()) {
        nextErrors.mainOfficeBarangay = "Select a barangay for the Philippine main office address.";
      } else if (nextErrors.mainOfficeBarangay !== "This already exist") {
        delete nextErrors.mainOfficeBarangay;
      }
    }

    if (field === "mainOfficeStreetAddress") {
      if (!philippinesMainOffice && !normalizedInfo.mainOfficeStreetAddress?.trim()) {
        nextErrors.mainOfficeStreetAddress = "Street Address is required for non-Philippine main office addresses.";
      } else if (nextErrors.mainOfficeStreetAddress !== "This already exist") {
        delete nextErrors.mainOfficeStreetAddress;
      }
    }

    if (field === "country" || field === "countryCode" || field === "province" || field === "cityMunicipality") {
      const fixedAddressErrors = validateFixedEbMagalonaAddress(normalizedInfo);
      if (fixedAddressErrors[field]) {
        nextErrors[field] = fixedAddressErrors[field] as string;
      }
    }

    if (field === "birthDate") {
      const birthDateRaw = normalizedInfo.birthDate?.trim() ?? "";
      if (!birthDateRaw) {
        nextErrors.birthDate = "Birthdate is required.";
      } else {
        try {
          const computedAge = calculateAgeFromBirthDate(birthDateRaw);
          if (computedAge < 18 || computedAge > 120) {
            nextErrors.birthDate = "Birthdate results in an age outside 18 to 120.";
          } else if (nextErrors.birthDate !== "This already exist") {
            delete nextErrors.birthDate;
          }
        } catch (error) {
          nextErrors.birthDate = error instanceof Error ? error.message : "Birthdate is invalid.";
        }
      }
    }

    if (field === "capitalInvestment") {
      const capitalRaw = normalizedInfo.capitalInvestment?.trim() ?? "";
      if (!capitalRaw) {
        nextErrors.capitalInvestment = "Capital Investment is required.";
      } else if (parsePositiveAmount(capitalRaw) == null) {
        nextErrors.capitalInvestment = "Capital Investment must be a positive amount.";
      } else if (nextErrors.capitalInvestment !== "This already exist") {
        delete nextErrors.capitalInvestment;
      }
    }

    if (field === "nationality" && normalizedInfo.nationality.trim().length === 0) {
      nextErrors.nationality = "Nationality is required.";
    }

    setFieldErrors(nextErrors);
  }

  function validateCurrentStep(currentStep: number): boolean {
    const normalizedInfo = normalizeBusinessInfo(info);
    const requiredFields = STEP_REQUIRED_FIELDS[currentStep] ?? [];
    const nextErrors: Partial<Record<keyof BusinessInfo, string>> = {};

    for (const key of requiredFields) {
      const value = normalizedInfo[key];
      if (typeof value !== "string" || value.trim().length === 0) {
        if (key === "mainOfficeAddress") {
          nextErrors[key] = requiresBarangay(normalizedInfo)
            ? "Fill in Country, Province, City/Municipality, and Barangay to auto-generate."
            : "Fill in Country, Province, City/Municipality, and Street Address to auto-generate.";
        } else {
          nextErrors[key] = `${FIELD_LABELS[key] ?? key} is required.`;
        }
      }
    }

    if (normalizedInfo.businessAddress.trim().length === 0) {
      nextErrors.businessAddress = "Business Address is required.";
    }

    const birthDateRaw = normalizedInfo.birthDate?.trim() ?? "";
    if (!birthDateRaw) {
      nextErrors.birthDate = "Birthdate is required.";
    } else {
      try {
        const computedAge = calculateAgeFromBirthDate(birthDateRaw);
        if (computedAge < 18 || computedAge > 120) {
          nextErrors.birthDate = "Birthdate results in an age outside 18 to 120.";
        }
      } catch (error) {
        nextErrors.birthDate = error instanceof Error ? error.message : "Birthdate is invalid.";
      }
    }

    const capitalRaw = normalizedInfo.capitalInvestment?.trim() ?? "";
    if (!capitalRaw) {
      nextErrors.capitalInvestment = "Capital Investment is required.";
    } else if (parsePositiveAmount(capitalRaw) == null) {
      nextErrors.capitalInvestment = "Capital Investment must be a positive amount.";
    }

    if (requiresBarangay(normalizedInfo) && normalizedInfo.mainOfficeBarangay?.trim().length === 0) {
      nextErrors.mainOfficeBarangay = "Barangay is required for Philippine main office addresses.";
    }

    if (normalizedInfo.mainOfficeCountry && !isPhilippinesCountry(normalizedInfo.mainOfficeCountry, normalizedInfo.mainOfficeCountryCode)) {
      if (normalizedInfo.mainOfficeStreetAddress?.trim().length === 0) {
        nextErrors.mainOfficeStreetAddress = "Street Address is required for non-Philippine main office addresses.";
      }
    }

    Object.assign(nextErrors, validateFixedEbMagalonaAddress(normalizedInfo));

    const identityFormats = validateBusinessIdentityFormats(normalizedInfo);
    if (normalizedInfo.registrationNumber.trim().length > 0 && !identityFormats.registrationNumber) {
      nextErrors.registrationNumber = "Wrong Format";
    }
    if (normalizedInfo.tin.trim().length > 0 && !identityFormats.tin) {
      nextErrors.tin = "Wrong Format";
    }

    Object.assign(nextErrors, validateBusinessLocation(normalizedInfo));

    if (currentStep === 1 && normalizedInfo.propertyOwnership === "Owned") {
      if (normalizedInfo.taxDeclarationNumber.trim().length === 0) {
        nextErrors.taxDeclarationNumber = "Tax Declaration Number is required for owned properties.";
      }
      if (normalizedInfo.propertyIdentificationNumber.trim().length === 0) {
        nextErrors.propertyIdentificationNumber = "Property Identification Number is required for owned properties.";
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function next() {
    if (isReadOnly) return;
    if (step === 0 || step === 1) {
      if (!validateCurrentStep(step)) {
        setStatusMessage({
          kind: "error",
          text: "Complete required fields before moving to the next step.",
        });
        return;
      }
    } else if (step === 2) {
      const uploadedKeys = [
        ...Object.values(uploadedDocuments).map((d) => d.documentName),
        ...Object.keys(pendingDocuments),
      ];
      const missing = getMissingRequiredDocuments(requiredDocs, uploadedKeys);
      if (missing.length > 0) {
        setMissingDocNames(missing);
        setStatusMessage({
          kind: "error",
          text: "Upload all required documents before proceeding.",
        });
        return;
      }
      setMissingDocNames([]);
    }

    setStatusMessage(null);
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function back() {
    if (isReadOnly) return;
    setStep((current) => Math.max(current - 1, 0));
  }

  async function persist(mode: PersistMode) {
    if (isReadOnly) {
      setStatusMessage({
        kind: "error",
        text: "This application has already been submitted and is now locked for review.",
      });
      return null;
    }

    setSubmitting(true);
    setStatusMessage(null);
    setFieldErrors({});

    const normalizedInfo = normalizeBusinessInfo(info);
    const identityFormats = validateBusinessIdentityFormats(normalizedInfo);
    const identityErrors: Partial<Record<keyof BusinessInfo, string>> = {};

    if (normalizedInfo.registrationNumber.trim().length > 0 && !identityFormats.registrationNumber) {
      identityErrors.registrationNumber = "Wrong Format";
    }

    if (normalizedInfo.tin.trim().length > 0 && !identityFormats.tin) {
      identityErrors.tin = "Wrong Format";
    }

    if (Object.keys(identityErrors).length > 0) {
      setFieldErrors(identityErrors);
      setStatusMessage({ kind: "error", text: "Wrong Format" });
      setSubmitting(false);
      return null;
    }

    if (mode === "SUBMIT") {
      if (!validateCurrentStep(0)) {
        setStep(0);
        setStatusMessage({
          kind: "error",
          text: "Complete all required business information fields before submitting.",
        });
        setSubmitting(false);
        return null;
      }

      if (!validateCurrentStep(1)) {
        setStep(1);
        setStatusMessage({
          kind: "error",
          text: "Complete all required operation fields before submitting.",
        });
        setSubmitting(false);
        return null;
      }

      const missingDocuments = getMissingRequiredDocuments(requiredDocs, [
        ...Object.values(uploadedDocuments).map((doc) => doc.documentName),
        ...Object.keys(pendingDocuments),
      ]);
      if (missingDocuments.length > 0) {
        setMissingDocNames(missingDocuments);
        setStep(2);
        setStatusMessage({
          kind: "error",
          text: "Upload all required documents before submitting.",
        });
        setSubmitting(false);
        return null;
      }
    }

    const payload: SaveApplicationInput = {
      applicationId,
      applicationType: "NEW",
      formData: info,
      documents: Object.values(uploadedDocuments),
      mode,
    };

    const response =
      mode === "SUBMIT"
        ? await (async () => {
            const formData = new FormData();
            formData.append("payload", JSON.stringify(payload));
            for (const [documentName, file] of Object.entries(pendingDocuments)) {
              formData.append("documentNames", documentName);
              formData.append("documentFiles", file, file.name);
            }

            return fetch("/api/applicant/applications", {
              method: "POST",
              body: formData,
            });
          })()
        : await fetch("/api/applicant/applications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

    const data = (await response.json()) as {
      application?: { id: string; applicationNumber: string; status: string };
      error?: string;
      duplicateField?: string;
    };

    setSubmitting(false);

    if (!response.ok || !data.application) {
      if (data.duplicateField === "registrationNumber" || data.duplicateField === "tin") {
        setFieldErrors({ [data.duplicateField]: "This already exist" });
      }
      setStatusMessage({
        kind: "error",
        text: data.error ?? "Unable to save application.",
      });
      setSubmitting(false);
      return null;
    }

    setApplicationId(data.application.id);

    if (mode === "SUBMIT") {
      setPendingDocuments({});
      setStatusMessage({
        kind: "success",
        text: `Application ${data.application.applicationNumber} submitted successfully.`,
      });
      return data.application.id;
    }

    setSubmitting(false);
    setStatusMessage({
      kind: "success",
      text: `Draft ${data.application.applicationNumber} saved successfully.`,
    });
    return data.application.id;
  }

  async function handleDocumentUpload(documentName: string, file: File | null) {
    if (isReadOnly) return;
    if (!file) return;

    setUploadedDocuments((current) => ({
      ...current,
      [documentName]: {
        documentName,
        fileName: file.name,
      },
    }));
    setPendingDocuments((current) => ({
      ...current,
      [documentName]: file,
    }));
    setMissingDocNames((current) =>
      current.filter(
        (m) => normalizeDocumentName(m) !== normalizeDocumentName(documentName)
      )
    );
  }

  async function handleDocumentDelete(documentName: string) {
    if (isReadOnly) return;
    const doc = uploadedDocuments[documentName];
    const hasSavedDocument = Boolean(doc?.id && applicationId);

    if (!hasSavedDocument) {
      setUploadedDocuments((current) => {
        const nextState = { ...current };
        delete nextState[documentName];
        return nextState;
      });
      setPendingDocuments((current) => {
        const nextState = { ...current };
        delete nextState[documentName];
        return nextState;
      });
      return;
    }

    setSubmitting(true);
    const response = await fetch(`/api/applicant/applications/${applicationId}/documents/${doc.id}`, {
      method: "DELETE",
    });

    setSubmitting(false);
    if (!response.ok) return;

    setUploadedDocuments((current) => {
      const nextState = { ...current };
      delete nextState[documentName];
      return nextState;
    });
    setPendingDocuments((current) => {
      const nextState = { ...current };
      delete nextState[documentName];
      return nextState;
    });
    setStatusMessage({
      kind: "success",
      text: `${documentName} removed.`,
    });
  }

  return (
    <div className="space-y-6">
      <FormStepper steps={steps} currentStep={step} />

      {statusMessage ? (
        <InfoBanner
          title={statusMessage.kind === "success" ? "Application update" : "Application issue"}
          description={statusMessage.text}
          variant={statusMessage.kind === "success" ? "success" : "danger"}
        />
      ) : null}

      {editId && existingApplicationAccess?.status === "Returned for Correction" ? (
        <InfoBanner
          title="Correction Mode"
          description="This application was returned for correction. You may edit the required fields and resubmit."
          variant="warning"
        />
      ) : null}

      {isReadOnly ? (
        <InfoBanner
          title="Application Locked"
          description="This application has already been submitted and is now locked for review."
          variant="info"
        />
      ) : null}

      {step === 0 ? (
        <SectionCard
          title="Business Information"
          description="Fields marked with an asterisk are required for draft saving and final submission."
        >
          <div className={lockInteractivityClass}>
          <BusinessInformationFields
            value={info}
            onChange={applyInfoChange}
            applicationType="NEW"
            onFieldBlur={validateFieldOnBlur}
            lockedFields={isReadOnly ? READ_ONLY_LOCKED_FIELDS : []}
            fieldErrors={fieldErrors}
            enableCascadingAddress
          />
          </div>
        </SectionCard>
      ) : null}

      {step === 1 ? (
        <div className={`space-y-4 ${lockInteractivityClass}`}>
          <InfoBanner
            title="Business operation details"
            description="Use current and accurate operating data to keep downstream assessment review consistent."
            variant="info"
          />
          <SectionCard
            title="Operations and Staffing"
            description="Provide the operating profile used later for assessment review."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {operationFields.map((field) => (
                <FieldCard
                  key={field.key}
                  label={field.label}
                  value={info[field.key] as string}
                  helperText={field.helperText}
                  error={fieldErrors[field.key]}
                  disabled={isReadOnly}
                  onBlur={() => validateFieldOnBlur(field.key)}
                  onChange={(value) =>
                    setInfo((current) => normalizeBusinessInfo({ ...current, [field.key]: value }))
                  }
                />
              ))}

              <FormField
                label="Business Activity"
                required
                error={fieldErrors.businessActivity}
              >
                <select
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  value={info.businessActivity}
                  disabled={isReadOnly}
                  onBlur={() => validateFieldOnBlur("businessActivity")}
                  onChange={(event) =>
                    setInfo((current) =>
                      normalizeBusinessInfo({ ...current, businessActivity: event.target.value })
                    )
                  }
                >
                  <option value="">Select business activity</option>
                  {BUSINESS_ACTIVITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Line of Business"
                required
                error={fieldErrors.lineOfBusiness}
              >
                <SearchableSelect
                  options={LINE_OF_BUSINESS_SELECT_OPTIONS}
                  value={info.lineOfBusiness}
                  selectedLabel={info.lineOfBusiness}
                  placeholder="Select line of business"
                  disabled={isReadOnly}
                  onChange={(option) => {
                    setInfo((current) =>
                      normalizeBusinessInfo({ ...current, lineOfBusiness: option.name })
                    );
                    setFieldErrors((current) => {
                      const next = { ...current };
                      delete next.lineOfBusiness;
                      return next;
                    });
                  }}
                />
                {fieldErrors.lineOfBusiness ? (
                  <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.lineOfBusiness}</p>
                ) : null}
              </FormField>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={info.isMarket}
                  disabled={isReadOnly}
                  onChange={(event) =>
                    setInfo((current) =>
                      normalizeBusinessInfo({ ...current, isMarket: event.target.checked })
                    )
                  }
                />
                <span>
                  <span className="block font-semibold text-slate-900">Market business</span>
                  Mark this if the business operates inside a public market or market stall so Market Clearance becomes required.
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={info.isAgriculture}
                  disabled={isReadOnly}
                  onChange={(event) =>
                    setInfo((current) =>
                      normalizeBusinessInfo({ ...current, isAgriculture: event.target.checked })
                    )
                  }
                />
                <span>
                  <span className="block font-semibold text-slate-900">Agriculture-related business</span>
                  Mark this if the business requires Department of Agriculture clearance.
                </span>
              </label>
            </div>
          </SectionCard>

          <SectionCard
            title="Property and Tax Basis"
            description="These details support the business location and property portion of the application."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">
                  Property Ownership <span className="text-red-600">*</span>
                </span>
                <select
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  value={info.propertyOwnership}
                  onChange={(event) =>
                    setInfo((current) =>
                      normalizeBusinessInfo({
                        ...current,
                        propertyOwnership: event.target.value as PropertyOwnership,
                      })
                    )
                  }
                >
                  <option>Owned</option>
                  <option>Not Owned</option>
                </select>
              </label>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {info.propertyOwnership === "Owned"
                  ? "Provide the tax declaration and property identification details below."
                  : "If the property is not owned, make sure the required lease or consent document is uploaded in the document step."}
              </div>

              {info.propertyOwnership === "Owned" ? (
                <>
                  <FieldCard
                    label="Tax Declaration Number"
                    value={info.taxDeclarationNumber}
                    error={fieldErrors.taxDeclarationNumber}
                    onBlur={() => validateFieldOnBlur("taxDeclarationNumber")}
                    onChange={(value) =>
                      setInfo((current) => normalizeBusinessInfo({ ...current, taxDeclarationNumber: value }))
                    }
                  />
                  <FieldCard
                    label="Property Identification Number"
                    value={info.propertyIdentificationNumber}
                    error={fieldErrors.propertyIdentificationNumber}
                    onBlur={() => validateFieldOnBlur("propertyIdentificationNumber")}
                    onChange={(value) =>
                      setInfo((current) =>
                        normalizeBusinessInfo({
                          ...current,
                          propertyIdentificationNumber: value,
                        })
                      )
                    }
                  />
                </>
              ) : null}
            </div>
          </SectionCard>
        </div>
      ) : null}

      {step === 2 ? (
        <div className={`space-y-4 ${lockInteractivityClass}`}>
          <InfoBanner
            title={`Required documents uploaded: ${uploadedRequiredCount} of ${requiredDocs.length}`}
            description="Select files locally first, then the final submit will save the documents and timestamps."
            variant="info"
          />
          <SectionCard
            title="Document Upload"
            description="Required files may vary based on business type and property ownership."
          >
            <div className="grid gap-3 md:grid-cols-2">
              {requiredDocs.map((doc) => {
                const uploadedDoc = getUploadedDocumentForRequiredName(doc);
                return (
                  <UploadSlot
                    key={doc}
                    label={doc}
                    required
                    helperText="Prepare a clear file copy before uploading."
                    disabled={submitting || isReadOnly}
                    fileName={uploadedDoc?.fileName}
                    uploadedAt={uploadedDoc?.uploadedAt}
                    error={
                      missingDocNames.some(
                        (m) => normalizeDocumentName(m) === normalizeDocumentName(doc)
                      )
                        ? "This document is required."
                        : undefined
                    }
                    onFileChange={(file) => {
                      void handleDocumentUpload(doc, file);
                    }}
                    onRemove={() => {
                      void handleDocumentDelete(uploadedDoc?.documentName ?? doc);
                    }}
                  />
                );
              })}
            </div>
          </SectionCard>
        </div>
      ) : null}

      {step === 3 ? (
        <div className={`space-y-4 ${lockInteractivityClass}`}>
          <SectionCard
            title="Preferred Payment Frequency"
            description="Choose how you prefer to pay the assessed fees. Final payment details are confirmed after BPLO assessment."
          >
            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">
                <input
                  type="radio"
                  name="paymentFrequency"
                  value="ANNUAL"
                  checked={info.paymentFrequency === "ANNUAL"}
                  disabled={isReadOnly}
                  onChange={() =>
                    setInfo((current) => normalizeBusinessInfo({ ...current, paymentFrequency: "ANNUAL" }))
                  }
                />
                Annual
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">
                <input
                  type="radio"
                  name="paymentFrequency"
                  value="BI_ANNUAL"
                  checked={info.paymentFrequency === "BI_ANNUAL"}
                  disabled={isReadOnly}
                  onChange={() =>
                    setInfo((current) => normalizeBusinessInfo({ ...current, paymentFrequency: "BI_ANNUAL" }))
                  }
                />
                Bi-Annual
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">
                <input
                  type="radio"
                  name="paymentFrequency"
                  value="QUARTERLY"
                  checked={info.paymentFrequency === "QUARTERLY"}
                  disabled={isReadOnly}
                  onChange={() =>
                    setInfo((current) => normalizeBusinessInfo({ ...current, paymentFrequency: "QUARTERLY" }))
                  }
                />
                Quarterly
              </label>
            </div>
          </SectionCard>

          <InfoBanner
            title="BPLO assessment"
            description="Fees will be assessed by BPLO after application review."
            variant="info"
          />
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <SectionCard
            title="Review and Submit"
            description="Confirm the encoded details and uploaded requirements before running final validation."
            action={
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={submitting || isReadOnly}
                  onClick={() => {
                    void persist("DRAFT");
                  }}
                  className={actionButtonStyles("secondary", "md")}
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={submitting || isReadOnly}
                  onClick={() => {
                    void persist("SUBMIT");
                  }}
                  className={actionButtonStyles("primary", "md")}
                >
                  Submit Application
                </button>
              </div>
            }
          >
            <div className="grid gap-4 md:grid-cols-3">
              <ReviewStat
                label="Business Name"
                value={info.businessName || "-"}
                helper="Applicant-entered business name"
              />
              <ReviewStat
                label="Application Type"
                value="New Application"
                helper="Workflow logic remains unchanged"
              />
              <ReviewStat
                label="Required Documents"
                value={`${uploadedRequiredCount} / ${requiredDocs.length}`}
                helper="Uploaded required document count"
              />
              <ReviewStat
                label="Payment Frequency"
                value={
                  info.paymentFrequency === "ANNUAL"
                    ? "Annual"
                    : info.paymentFrequency === "BI_ANNUAL"
                      ? "Bi-Annual"
                      : "Quarterly"
                }
                helper="Applicant preference for assessed fee payment"
              />
              <ReviewStat label="Country" value={info.country?.trim() || "-"} />
              <ReviewStat label="Province" value={info.province?.trim() || "-"} />
              <ReviewStat
                label="City / Municipality"
                value={info.cityMunicipality?.trim() || "-"}
              />
              <ReviewStat
                label="Street Address"
                value={info.streetAddress?.trim() || "-"}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Main Office Address</p>
              <p className="mt-1">{info.mainOfficeAddress || "-"}</p>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Business Address</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {info.businessLatitude != null && info.businessLongitude != null
                  ? "Business location pinned"
                  : "Business location not pinned"}
              </p>
              <p className="mt-1">{info.businessAddress || "-"}</p>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Before you submit</p>
              <ul className="mt-2 space-y-1">
                <li>• Review the business information and operational details for accuracy.</li>
                <li>• Confirm each required document is uploaded with a clear file copy.</li>
                <li>• Use Save Draft if you still need to continue later.</li>
              </ul>
            </div>
          </SectionCard>

        </div>
      ) : null}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          disabled={step === 0 || isReadOnly}
          onClick={back}
          className={actionButtonStyles("ghost", "md")}
        >
          Back
        </button>
        <button
          type="button"
          disabled={step === steps.length - 1 || isReadOnly}
          onClick={next}
          className={actionButtonStyles("primary", "md")}
        >
          Next
        </button>
      </div>
    </div>
  );
}
