"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { defaultBusinessInfo } from "@/lib/applicant-mock";
import { normalizeBusinessInfo as normalizeBusinessInfoRules } from "@/lib/business-rules";
import { isWithinEbMagalona } from "@/lib/eb-magalona";
import { calculateAgeFromBirthDate, isPhilippinesCountry, validateBusinessIdentityFormats } from "@/lib/business-rules";
import { BUSINESS_ACTIVITY_OPTIONS } from "@/lib/business-rules";
import {
  EB_MAGALONA_CITY,
  EB_MAGALONA_COUNTRY,
  EB_MAGALONA_COUNTRY_CODE,
  EB_MAGALONA_PROVINCE,
  isEbMagalonaCity,
  isEbMagalonaProvince,
} from "@/lib/address-options";
import type { AddressOption } from "@/lib/address-types";

import { BusinessInformationFields } from "./business-information-fields";
import { FormStepper } from "@/components/applicant/form-stepper";
import { UploadSlot } from "@/components/applicant/upload-slot";
import {
  getMissingRequiredDocuments,
  normalizeDocumentName,
  resolveRequiredDocuments,
} from "@/lib/required-documents";
import {
  DOCUMENT_FILE_INPUT_ACCEPT,
  validateDocumentFileUpload,
} from "@/lib/document-upload-rules";
import { isValidLineOfBusiness, LINE_OF_BUSINESS_OPTIONS } from "@/lib/business-options";
import type {
  ApplicationDocumentInput,
  BusinessInfo,
  PersistMode,
  PropertyOwnership,
  SaveApplicationInput,
  SubmitValidationErrorDetail,
} from "@/lib/applicant-types";
import { actionButtonStyles } from "@/components/ui/action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { InfoBanner } from "@/components/ui/info-banner";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SectionCard } from "@/components/ui/section-card";

const steps = [
  {
    title: "Select Existing Business",
    description: "Choose the registered business record to renew.",
  },
  {
    title: "Review Business Information",
    description: "Check the carried-over record and editable details.",
  },
  {
    title: "Upload Renewal Documents",
    description: "Attach all current clearances and supporting files.",
  },
  {
    title: "Assessment Notice",
    description: "Final fees are assessed by BPLO after application review.",
  },
  {
    title: "Review and Submit",
    description: "Confirm the renewal package before submission.",
  },
];

const lockedFields: Array<keyof BusinessInfo> = [
  "businessType",
  "registrationNumber",
  "tin",
  "businessName",
  "tradeName",
  "ownerName",
  "ownerFirstName",
  "ownerMiddleName",
  "ownerSurname",
  "ownerSuffix",
  "nationality",
];

const LINE_OF_BUSINESS_SELECT_OPTIONS: AddressOption[] = LINE_OF_BUSINESS_OPTIONS.map((option) => ({
  value: option,
  label: option,
  name: option,
}));

const RENEWAL_OPERATION_FIELDS: Array<{ label: string; key: keyof BusinessInfo; helperText?: string }> = [
  { label: "Business Area", key: "businessArea", helperText: "Use the declared operating area." },
  { label: "Total Floor Area", key: "totalFloorArea" },
  { label: "Total Employees", key: "totalEmployees" },
  { label: "Male Employees", key: "maleEmployees" },
  { label: "Female Employees", key: "femaleEmployees" },
  { label: "Employees Residing within Municipality", key: "employeesWithinMunicipality" },
  { label: "Delivery Vehicles", key: "deliveryVehicles" },
  { label: "Asset Size", key: "assetSize", helperText: "Use the declared amount in pesos." },
];

function normalizeBusinessInfo(next: BusinessInfo): BusinessInfo {
  return normalizeBusinessInfoRules(next);
}

function resolveRenewalLineOfBusiness(value: string | null | undefined): string {
  return isValidLineOfBusiness(value) ? value.trim() : "";
}

const BUSINESS_LOCATION_ERROR = "Please pin the business location inside EB Magalona.";

function validateBusinessLocation(info: BusinessInfo): Partial<Record<keyof BusinessInfo, string>> {
  const nextErrors: Partial<Record<keyof BusinessInfo, string>> = {};

  const latitude = Number(info.businessLatitude);
  const longitude = Number(info.businessLongitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    nextErrors.businessLatitude = BUSINESS_LOCATION_ERROR;
    return nextErrors;
  }

  if (!isWithinEbMagalona(latitude, longitude)) {
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

  return nextErrors;
}

function logStepValidationDebug(params: {
  step: number;
  missingKeys: string[];
  info: BusinessInfo;
}) {
  if (process.env.NODE_ENV === "production") return;
  if (params.missingKeys.length === 0) return;

  const businessAddressRelatedEntries = Object.entries(params.info).filter(([key]) =>
    key.startsWith("business") ||
    ["country", "countryCode", "province", "provinceCode", "cityMunicipality", "streetAddress", "barangay"].includes(key)
  );

  console.info("[RenewalApplicationForm] Step validation missing fields", {
    stepIndex: params.step,
    stepName: steps[params.step]?.title ?? "Unknown",
    missingKeys: params.missingKeys,
    businessAddressSnapshot: {
      country: params.info.country,
      province: params.info.province,
      cityMunicipality: params.info.cityMunicipality,
      barangay: params.info.barangay,
      streetAddress: params.info.streetAddress,
      businessBarangay: params.info.businessBarangay,
      businessStreet: params.info.businessStreetAddress,
      businessStreetAddress: params.info.businessStreetAddress,
      businessLatitude: params.info.businessLatitude,
      businessLatitudeType: typeof params.info.businessLatitude,
      businessLongitude: params.info.businessLongitude,
      businessLongitudeType: typeof params.info.businessLongitude,
    },
    businessAddressRelatedFormData: Object.fromEntries(businessAddressRelatedEntries),
  });
}

function parsePositiveAmount(value: string): number | null {
  const normalized = value.replace(/[,\s]/g, "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function sanitizeDocumentMetadata(documents: ApplicationDocumentInput[]): ApplicationDocumentInput[] {
  return documents.map((doc) => ({
    id: doc.id,
    documentType: doc.documentType ?? doc.documentName,
    documentName: doc.documentName,
    fileName: doc.fileName,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    fileSize: doc.fileSize,
    bucket: doc.bucket,
    storagePath: doc.storagePath,
    filePath: doc.filePath,
  }));
}

function buildCleanPayload(params: {
  applicationId?: string;
  selectedBusinessId: string;
  mode: PersistMode;
  info: BusinessInfo;
  documents: ApplicationDocumentInput[];
}): SaveApplicationInput {
  return {
    applicationId: params.applicationId,
    applicationType: "RENEWAL",
    businessRecordId: params.selectedBusinessId || undefined,
    formData: normalizeBusinessInfo(params.info),
    documents: sanitizeDocumentMetadata(params.documents),
    mode: params.mode,
  };
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

function ValidationPanel({ detail }: { detail: SubmitValidationErrorDetail }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p className="font-semibold">Submission requirements still missing</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
            Missing Fields
          </p>
          <ul className="mt-2 space-y-1">
            {detail.missingFields.length > 0 ? (
              detail.missingFields.map((item) => <li key={item}>• {item}</li>)
            ) : (
              <li>• None</li>
            )}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
            Missing Documents
          </p>
          <ul className="mt-2 space-y-1">
            {detail.missingDocuments.length > 0 ? (
              detail.missingDocuments.map((item) => <li key={item}>• {item}</li>)
            ) : (
              <li>• None</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

type RenewalBlockedRecord = {
  id: string;
  registrationNumber: string;
  businessName: string;
  closedAt: string | null;
  renewalEligibility: {
    eligible: boolean;
    reasonCode: string | null;
    userFriendlyReason: string | null;
    blockingInspectionId: string | null;
    complianceCaseStatus: string | null;
    nonComplianceType: string | null;
  };
};

function humanizeCaseStatus(value: string | null): string {
  if (value === "FLAGGED_UNSETTLED") return "Flagged / Unsettled";
  if (value === "SETTLED") return "Settled";
  if (value === "EXPIRED_UNSETTLED") return "Expired / Unsettled";
  if (value === "FORCED_CLOSURE_PENDING") return "Forced Closure Pending";
  if (value === "CLOSED_NON_COMPLIANT") return "Closed Non-Compliant";
  return value ?? "-";
}

function humanizeNonComplianceType(value: string | null): string {
  if (value === "GOVERNMENT_AGENCY_RELATED") return "Government Agency Related";
  if (value === "RENEWAL_RELATED") return "Renewal Related";
  return value ?? "-";
}

export function RenewalApplicationForm() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("applicationId");

  const [step, setStep] = useState(0);
  const [applicationId, setApplicationId] = useState<string | undefined>(editId ?? undefined);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [records, setRecords] = useState<
    Array<{ id: string; registrationNumber: string; businessName: string; businessInfo: BusinessInfo }>
  >([]);
  const [blockedRecords, setBlockedRecords] = useState<RenewalBlockedRecord[]>([]);
  const [info, setInfo] = useState<BusinessInfo>(defaultBusinessInfo);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, ApplicationDocumentInput>>({});
  const [statusMessage, setStatusMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [validationDetail, setValidationDetail] = useState<SubmitValidationErrorDetail | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof BusinessInfo, string>>>({});
  const [unavailableCount, setUnavailableCount] = useState(0);
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

  const requiredRenewalDocs = useMemo(
    () =>
      resolveRequiredDocuments({
        applicationType: "RENEWAL",
        formData: info,
      }),
    [info]
  );

  const getUploadedDocumentForRequiredName = (requiredName: string) =>
    Object.values(uploadedDocuments).find(
      (doc) => normalizeDocumentName(doc.documentName) === normalizeDocumentName(requiredName)
    );

  const uploadedRequiredCount = requiredRenewalDocs.filter((doc) => getUploadedDocumentForRequiredName(doc)).length;
  const selectedRecord = records.find((item) => item.id === selectedBusinessId);
  const selectedRecordLineOfBusiness = (selectedRecord?.businessInfo.lineOfBusiness ?? "").trim();
  const hasLockedRecordLineOfBusiness = isValidLineOfBusiness(selectedRecordLineOfBusiness);
  const renewalLineOfBusinessLocked = hasLockedRecordLineOfBusiness || isReadOnly;

  useEffect(() => {
    if (!hasLockedRecordLineOfBusiness) return;
    if (info.lineOfBusiness === selectedRecordLineOfBusiness) return;

    setInfo((current) =>
      normalizeBusinessInfo({
        ...current,
        lineOfBusiness: selectedRecordLineOfBusiness,
      })
    );
  }, [hasLockedRecordLineOfBusiness, info.lineOfBusiness, selectedRecordLineOfBusiness]);

  function validateFieldOnBlur(field: keyof BusinessInfo) {
    if (isReadOnly) return;
    const nextErrors = { ...fieldErrors };
    const normalizedInfo = normalizeBusinessInfo(info);
    const value = normalizedInfo[field];

    const requiredFields: Array<keyof BusinessInfo> = ["email", "mainOfficeAddress", "phone", "businessAddress"];
    if (requiredFields.includes(field) && (typeof value !== "string" || value.trim().length === 0)) {
      nextErrors[field] = `${field === "phone" ? "Contact Number" : field === "mainOfficeAddress" ? "Main Office Address" : field === "businessAddress" ? "Business Address" : "Email"} is required.`;
    } else if (nextErrors[field] !== "This already exist") {
      delete nextErrors[field];
    }

    if (field === "mainOfficeBarangay") {
      if (requiresBarangay(normalizedInfo) && !normalizedInfo.mainOfficeBarangay?.trim()) {
        nextErrors.mainOfficeBarangay = "Select a barangay for the Philippine main office address.";
      } else if (nextErrors.mainOfficeBarangay !== "This already exist") {
        delete nextErrors.mainOfficeBarangay;
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

    if (field === "grossProfit") {
      const grossRaw = normalizedInfo.grossProfit?.trim() ?? "";
      if (!grossRaw) {
        nextErrors.grossProfit = "Gross Receipts / Gross Sales is required.";
      } else if (parsePositiveAmount(grossRaw) == null) {
        nextErrors.grossProfit = "Gross Receipts / Gross Sales must be a positive amount.";
      } else if (nextErrors.grossProfit !== "This already exist") {
        delete nextErrors.grossProfit;
      }
    }

    if (field === "lineOfBusiness") {
      if (!hasLockedRecordLineOfBusiness && !normalizedInfo.lineOfBusiness.trim()) {
        nextErrors.lineOfBusiness = "Line of Business is required.";
      } else if (nextErrors.lineOfBusiness !== "This already exist") {
        delete nextErrors.lineOfBusiness;
      }
    }

    if (field === "registrationNumber" && normalizedInfo.registrationNumber.trim().length > 0) {
      const valid = validateBusinessIdentityFormats(normalizedInfo).registrationNumber;
      if (!valid) nextErrors.registrationNumber = "Wrong Format";
    }

    if (field === "tin" && normalizedInfo.tin.trim().length > 0) {
      const valid = validateBusinessIdentityFormats(normalizedInfo).tin;
      if (!valid) nextErrors.tin = "Wrong Format";
    }

    setFieldErrors(nextErrors);
  }

  useEffect(() => {
    let active = true;

    async function loadRecords() {
      const response = await fetch("/api/applicant/business-records?applicationType=RENEWAL", { cache: "no-store" });
      const data = (await response.json()) as {
        records?: Array<{ id: string; registrationNumber: string; businessName: string; businessInfo: BusinessInfo }>;
        blockedRecords?: RenewalBlockedRecord[];
      };

      if (!active || !response.ok || !data.records) return;

      setRecords(data.records);
      setBlockedRecords(data.blockedRecords ?? []);
      setUnavailableCount(data.blockedRecords?.length ?? 0);
      if (data.records[0] && !selectedBusinessId) {
        setSelectedBusinessId(data.records[0].id);
          setInfo(
            normalizeBusinessInfo({
              ...defaultBusinessInfo,
              ...data.records[0].businessInfo,
              lineOfBusiness: resolveRenewalLineOfBusiness(data.records[0].businessInfo.lineOfBusiness),
              paymentFrequency: data.records[0].businessInfo.paymentFrequency ?? "ANNUAL",
            })
          );
      }
    }

    void loadRecords();
    return () => {
      active = false;
    };
  }, [selectedBusinessId]);

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
          businessRecordId?: string;
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
      if (data.application.businessRecordId) setSelectedBusinessId(data.application.businessRecordId);
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

  function next() {
    if (isReadOnly) return;
    if (step === 0 && !selectedBusinessId) {
      setFieldErrors({ businessName: "Select an existing business record first." });
      setStatusMessage({ kind: "error", text: "Select an existing business record before proceeding." });
      return;
    }

    if (step === 1) {
      const normalizedInfo = normalizeBusinessInfo(info);
      const nextErrors: Partial<Record<keyof BusinessInfo, string>> = {};
      if (!normalizedInfo.email.trim()) nextErrors.email = "Email is required.";
      if (!normalizedInfo.mainOfficeAddress.trim()) nextErrors.mainOfficeAddress = "Main Office Address is required.";
      if (!normalizedInfo.phone.trim()) nextErrors.phone = "Contact Number is required.";
      if (!hasLockedRecordLineOfBusiness && !normalizedInfo.lineOfBusiness.trim()) {
        nextErrors.lineOfBusiness = "Line of Business is required.";
      }
      if (requiresBarangay(normalizedInfo) && !normalizedInfo.mainOfficeBarangay?.trim()) {
        nextErrors.mainOfficeBarangay = "Barangay is required for Philippine main office addresses.";
      }
      if (!normalizedInfo.businessBarangay?.trim()) {
        nextErrors.businessBarangay = "Business Barangay is required.";
      }
      if (!normalizedInfo.businessStreetAddress?.trim()) {
        nextErrors.businessStreetAddress = "Business Street / Purok / Building / Unit is required.";
      }

      Object.assign(nextErrors, validateFixedEbMagalonaAddress(normalizedInfo));

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

      const grossRaw = normalizedInfo.grossProfit?.trim() ?? "";
      if (!grossRaw) {
        nextErrors.grossProfit = "Gross Receipts / Gross Sales is required.";
      } else if (parsePositiveAmount(grossRaw) == null) {
        nextErrors.grossProfit = "Gross Receipts / Gross Sales must be a positive amount.";
      }

      const identityFormats = validateBusinessIdentityFormats(normalizedInfo);
      if (normalizedInfo.registrationNumber.trim().length > 0 && !identityFormats.registrationNumber) {
        nextErrors.registrationNumber = "Wrong Format";
      }
      if (normalizedInfo.tin.trim().length > 0 && !identityFormats.tin) {
        nextErrors.tin = "Wrong Format";
      }

      Object.assign(nextErrors, validateBusinessLocation(normalizedInfo));

      logStepValidationDebug({
        step,
        missingKeys: Object.keys(nextErrors),
        info: normalizedInfo,
      });

      if (Object.keys(nextErrors).length > 0) {
        setFieldErrors(nextErrors);
        setStatusMessage({ kind: "error", text: "Complete required fields before moving to the next step." });
        return;
      }
    }

    setFieldErrors({});
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
    setValidationDetail(null);
    setFieldErrors({});

    const identityFormats = validateBusinessIdentityFormats(info);
    const identityErrors: Partial<Record<keyof BusinessInfo, string>> = {};

    if (info.registrationNumber.trim().length > 0 && !identityFormats.registrationNumber) {
      identityErrors.registrationNumber = "Wrong Format";
    }
    if (info.tin.trim().length > 0 && !identityFormats.tin) {
      identityErrors.tin = "Wrong Format";
    }

    if (Object.keys(identityErrors).length > 0) {
      setFieldErrors(identityErrors);
      setStatusMessage({ kind: "error", text: "Wrong Format" });
      setSubmitting(false);
      return null;
    }

    if (!selectedRecord) {
      setStatusMessage({
        kind: "error",
        text: unavailableCount > 0
          ? "Select an eligible business record before submitting renewal. Some businesses are currently unavailable for renewal."
          : "Select an eligible business record before submitting renewal.",
      });
      setSubmitting(false);
      return null;
    }

    if (mode === "SUBMIT") {
      const locationErrors = validateBusinessLocation(info);
      if (Object.keys(locationErrors).length > 0) {
        setFieldErrors(locationErrors);
        setStatusMessage({ kind: "error", text: BUSINESS_LOCATION_ERROR });
        setSubmitting(false);
        return null;
      }

      if (requiresBarangay(info) && !info.mainOfficeBarangay?.trim()) {
        setFieldErrors({ mainOfficeBarangay: "Barangay is required for Philippine main office addresses." });
        setStatusMessage({ kind: "error", text: "Barangay is required for Philippine main office addresses." });
        setSubmitting(false);
        return null;
      }

      const fixedAddressErrors = validateFixedEbMagalonaAddress(info);
      if (Object.keys(fixedAddressErrors).length > 0) {
        setFieldErrors(fixedAddressErrors);
        setStatusMessage({ kind: "error", text: "Business address must remain within fixed EB Magalona values." });
        setSubmitting(false);
        return null;
      }

      const birthDateRaw = info.birthDate?.trim() ?? "";
      if (!birthDateRaw) {
        setFieldErrors({ birthDate: "Birthdate is required." });
        setStatusMessage({ kind: "error", text: "Birthdate is required." });
        setSubmitting(false);
        return null;
      }

      try {
        const computedAge = calculateAgeFromBirthDate(birthDateRaw);
        if (computedAge < 18 || computedAge > 120) {
          setFieldErrors({ birthDate: "Birthdate results in an age outside 18 to 120." });
          setStatusMessage({ kind: "error", text: "Birthdate results in an age outside 18 to 120." });
          setSubmitting(false);
          return null;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Birthdate is invalid.";
        setFieldErrors({ birthDate: message });
        setStatusMessage({ kind: "error", text: message });
        setSubmitting(false);
        return null;
      }

      const grossRaw = info.grossProfit?.trim() ?? "";
      if (!grossRaw || parsePositiveAmount(grossRaw) == null) {
        setFieldErrors({ grossProfit: "Gross Receipts / Gross Sales must be a positive amount." });
        setStatusMessage({ kind: "error", text: "Gross Receipts / Gross Sales must be a positive amount." });
        setSubmitting(false);
        return null;
      }

      if (!hasLockedRecordLineOfBusiness && !info.lineOfBusiness.trim()) {
        setFieldErrors({ lineOfBusiness: "Line of Business is required." });
        setStatusMessage({ kind: "error", text: "Line of Business is required for renewal submission." });
        setSubmitting(false);
        return null;
      }

      const missingDocuments = getMissingRequiredDocuments(requiredRenewalDocs, [
        ...Object.values(uploadedDocuments).map((doc) => doc.documentName),
      ]);
      if (missingDocuments.length > 0) {
        setStep(2);
        setValidationDetail({ missingFields: [], missingDocuments });
        setStatusMessage({
          kind: "error",
          text: "Upload all required renewal documents before submitting.",
        });
        setSubmitting(false);
        return null;
      }
    }

    const payload = buildCleanPayload({
      applicationId,
      selectedBusinessId,
      mode,
      info,
      documents: Object.values(uploadedDocuments),
    });

    const response = await fetch("/api/applicant/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as {
      application?: { id: string; applicationNumber: string; status: string };
      error?: string;
      detail?: SubmitValidationErrorDetail;
      duplicateField?: string;
    };
    setSubmitting(false);

    if (!response.ok || !data.application) {
      if (data.duplicateField === "registrationNumber" || data.duplicateField === "tin") {
        setFieldErrors({ [data.duplicateField]: "This already exist" });
      }
      setStatusMessage({
        kind: "error",
        text: data.error ?? "Unable to save renewal application.",
      });
      if (data.detail) setValidationDetail(data.detail);
      return null;
    }

    setApplicationId(data.application.id);

    if (mode === "SUBMIT") {
      setStatusMessage({
        kind: "success",
        text: `Renewal ${data.application.applicationNumber} submitted successfully.`,
      });
      return data.application.id;
    }

    setStatusMessage({
      kind: "success",
      text: `Renewal draft ${data.application.applicationNumber} saved successfully.`,
    });
    return data.application.id;
  }

  async function handleDocumentUpload(documentName: string, file: File | null) {
    if (isReadOnly) return;
    if (!file) return;

    const fileValidationError = validateDocumentFileUpload(file);
    if (fileValidationError) {
      setStatusMessage({ kind: "error", text: fileValidationError });
      return;
    }

    let targetApplicationId = applicationId;
    if (!targetApplicationId) {
      const draftId = await persist("DRAFT");
      if (!draftId) {
        setStatusMessage({
          kind: "error",
          text: "Save a draft first before uploading documents.",
        });
        return;
      }
      targetApplicationId = draftId;
    }

    setSubmitting(true);
    const uploadFormData = new FormData();
    uploadFormData.append("documentName", documentName);
    uploadFormData.append("file", file, file.name);

    const response = await fetch(`/api/applicant/applications/${targetApplicationId}/documents`, {
      method: "POST",
      body: uploadFormData,
    });

    const data = (await response.json()) as { document?: ApplicationDocumentInput; error?: string };
    setSubmitting(false);

    if (!response.ok || !data.document) {
      setStatusMessage({
        kind: "error",
        text: data.error ?? "Unable to upload document.",
      });
      return;
    }

    setApplicationId(targetApplicationId);
    setUploadedDocuments((current) => ({
      ...current,
      [documentName]: {
        ...data.document,
        documentType: data.document.documentType ?? documentName,
        documentName,
      },
    }));
    setStatusMessage({ kind: "success", text: `${documentName} uploaded successfully.` });
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
          title={statusMessage.kind === "success" ? "Renewal update" : "Renewal issue"}
          description={statusMessage.text}
          variant={statusMessage.kind === "success" ? "success" : "danger"}
        />
      ) : null}

      {editId && existingApplicationAccess?.status === "Returned for Correction" ? (
        <InfoBanner
          title="Correction Mode"
          description="This renewal was returned for correction. You may edit and resubmit."
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
          title="Select Existing Business"
          description="Renewal starts from a registered business record. Core registration fields stay locked to preserve the existing record."
        >
          <div className="space-y-4">
            {records.length === 0 ? (
              <EmptyState
                title={unavailableCount > 0 ? "No eligible renewal records" : "No records available yet"}
                description={
                  unavailableCount > 0
                    ? "Some businesses are currently unavailable for renewal. Review the section below for reasons."
                    : "No action is required right now. This renewal form will populate once you have an existing business record."
                }
              />
            ) : (
              <FormField
                label="Existing Business Record"
                hint="Choose which registered business record you want to renew."
                required
              >
                <select
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  value={selectedBusinessId}
                  disabled={records.length === 0 || isReadOnly}
                  onChange={(event) => {
                    const selectedId = event.target.value;
                    setSelectedBusinessId(selectedId);
                    const selected = records.find((item) => item.id === selectedId);
                    if (selected) {
                      setInfo(
                        normalizeBusinessInfo({
                          ...defaultBusinessInfo,
                          ...selected.businessInfo,
                          lineOfBusiness: resolveRenewalLineOfBusiness(selected.businessInfo.lineOfBusiness),
                          paymentFrequency: selected.businessInfo.paymentFrequency ?? "ANNUAL",
                        })
                      );
                      setFieldErrors({});
                    }
                  }}
                >
                  {records.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.businessName} ({business.registrationNumber})
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            {selectedRecord ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">{selectedRecord.businessName}</p>
                <p className="mt-1">Registration: {selectedRecord.registrationNumber}</p>
                <p className="mt-1">Email: {selectedRecord.businessInfo.email}</p>
              </div>
            ) : null}

            {blockedRecords.length > 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">Unavailable for renewal</p>
                <div className="mt-3 space-y-3">
                  {blockedRecords.map((record) => (
                    <div key={record.id} className="rounded-xl border border-amber-200 bg-white p-3 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">{record.businessName}</p>
                      <p className="text-xs text-slate-500">{record.registrationNumber}</p>
                      <p className="mt-1 text-sm text-slate-700">
                        {record.renewalEligibility.userFriendlyReason ?? "Unavailable for renewal."}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                          {humanizeNonComplianceType(record.renewalEligibility.nonComplianceType)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                          {humanizeCaseStatus(record.renewalEligibility.complianceCaseStatus)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </SectionCard>
      ) : null}

      {step === 1 ? (
        <div className={`space-y-4 ${lockInteractivityClass}`}>
          <InfoBanner
            title="Locked fields come from the selected business record"
            description="Business type, registration details, and owner identity remain read-only during renewal. Editable fields can still be updated if needed."
            variant="readOnly"
          />
          <SectionCard
            title="Review Business Information"
            description="Required fields are marked clearly. Locked values are visually separated and remain unchanged."
          >
            <BusinessInformationFields
              value={info}
              onChange={(nextInfo) => {
                const normalizedNext = normalizeBusinessInfo(nextInfo);
                setInfo({
                  ...normalizedNext,
                  businessStreetAddress: nextInfo.businessStreetAddress,
                  streetAddress: nextInfo.streetAddress,
                });
                if (
                  typeof normalizedNext.businessLatitude === "number" &&
                  typeof normalizedNext.businessLongitude === "number" &&
                  isWithinEbMagalona(normalizedNext.businessLatitude, normalizedNext.businessLongitude)
                ) {
                  setFieldErrors((current) => {
                    if (!current.businessLatitude && !current.businessLongitude) {
                      return current;
                    }
                    const nextErrors = { ...current };
                    delete nextErrors.businessLatitude;
                    delete nextErrors.businessLongitude;
                    return nextErrors;
                  });
                }
              }}
              applicationType="RENEWAL"
              onFieldBlur={validateFieldOnBlur}
              lockedFields={lockedFields}
              fieldErrors={fieldErrors}
              enableCascadingAddress
            />

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={info.isMarket}
                  onChange={(event) =>
                    setInfo((current) =>
                      normalizeBusinessInfo({ ...current, isMarket: event.target.checked })
                    )
                  }
                />
                <span>
                  <span className="block font-semibold text-slate-900">Market business</span>
                  Keep this checked when the registered business still operates inside a public market or market stall.
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={info.isAgriculture}
                  onChange={(event) =>
                    setInfo((current) =>
                      normalizeBusinessInfo({ ...current, isAgriculture: event.target.checked })
                    )
                  }
                />
                <span>
                  <span className="block font-semibold text-slate-900">Agriculture-related business</span>
                  Keep this checked when Department of Agriculture clearance is still required for this renewal.
                </span>
              </label>
            </div>
          </SectionCard>

          <SectionCard
            title="Operations and Staffing"
            description="Update operating profile details for this renewal period."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {RENEWAL_OPERATION_FIELDS.map((field) => (
                <FormField key={field.key} label={field.label} hint={field.helperText}>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                    value={(info[field.key] as string | undefined) ?? ""}
                    onBlur={() => validateFieldOnBlur(field.key)}
                    onChange={(event) =>
                      setInfo((current) =>
                        normalizeBusinessInfo({ ...current, [field.key]: event.target.value })
                      )
                    }
                  />
                </FormField>
              ))}

              <FormField
                label="Gross Receipts / Gross Sales"
                hint="Enter the latest declared gross receipts or gross sales amount in pesos."
                error={fieldErrors.grossProfit}
              >
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  value={info.grossProfit ?? ""}
                  onBlur={() => validateFieldOnBlur("grossProfit")}
                  onChange={(event) =>
                    setInfo((current) =>
                      normalizeBusinessInfo({ ...current, grossProfit: event.target.value })
                    )
                  }
                />
              </FormField>

              <FormField label="Business Activity" error={fieldErrors.businessActivity}>
                <select
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  value={info.businessActivity}
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
                hint={
                  hasLockedRecordLineOfBusiness
                    ? "Line of Business is based on your existing business record."
                    : "Please select the line of business for this business."
                }
                error={fieldErrors.lineOfBusiness}
              >
                <SearchableSelect
                  options={LINE_OF_BUSINESS_SELECT_OPTIONS}
                  value={info.lineOfBusiness}
                  selectedLabel={info.lineOfBusiness}
                  placeholder="Select line of business"
                  disabled={renewalLineOfBusinessLocked}
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
          </SectionCard>

          <SectionCard
            title="Property and Tax Basis"
            description="Property details for business location and assessment basis."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Property Ownership">
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
              </FormField>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {info.propertyOwnership === "Owned" ? (
                  <div className="space-y-3">
                    <FormField label="Tax Declaration Number">
                      <input
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                        value={info.taxDeclarationNumber ?? ""}
                        onChange={(event) =>
                          setInfo((current) =>
                            normalizeBusinessInfo({ ...current, taxDeclarationNumber: event.target.value })
                          )
                        }
                      />
                    </FormField>
                    <FormField label="Property Identification Number">
                      <input
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                        value={info.propertyIdentificationNumber ?? ""}
                        onChange={(event) =>
                          setInfo((current) =>
                            normalizeBusinessInfo({
                              ...current,
                              propertyIdentificationNumber: event.target.value,
                            })
                          )
                        }
                      />
                    </FormField>
                  </div>
                ) : (
                  <p>Property is not owned — no tax declaration or property identification required.</p>
                )}
              </div>
            </div>
          </SectionCard>
        </div>
      ) : null}

      {step === 2 ? (
        <div className={`space-y-4 ${lockInteractivityClass}`}>
          <InfoBanner
            title={`Required documents uploaded: ${uploadedRequiredCount} of ${requiredRenewalDocs.length}`}
            description="Upload each required document now. Final submit sends only document metadata references."
            variant="info"
          />
          <SectionCard
            title="Upload Renewal Documents"
            description="Conditional clearances may appear depending on the line of business and recorded activity."
          >
            <div className="grid gap-3 md:grid-cols-2">
              {requiredRenewalDocs.map((doc) => {
                const uploadedDoc = getUploadedDocumentForRequiredName(doc);
                return (
                  <UploadSlot
                    key={doc}
                    label={doc}
                    required
                    helperText="Upload the latest valid copy for renewal review."
                    disabled={submitting || records.length === 0 || isReadOnly}
                    fileName={uploadedDoc?.fileName}
                    uploadedAt={uploadedDoc?.uploadedAt}
                    onFileChange={(file) => {
                      void handleDocumentUpload(doc, file);
                    }}
                    accept={DOCUMENT_FILE_INPUT_ACCEPT}
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
            title="Preferred Mode of Payment"
            description="Choose how you prefer to pay the assessed fees. Final payment details are confirmed after BPLO assessment."
          >
            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">
                <input
                  type="radio"
                  name="renewalPaymentFrequency"
                  value="ANNUAL"
                  checked={info.paymentFrequency === "ANNUAL"}
                  disabled={isReadOnly}
                  onChange={() => setInfo((current) => ({ ...current, paymentFrequency: "ANNUAL" }))}
                />
                Annual
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">
                <input
                  type="radio"
                  name="renewalPaymentFrequency"
                  value="BI_ANNUAL"
                  checked={info.paymentFrequency === "BI_ANNUAL"}
                  disabled={isReadOnly}
                  onChange={() => setInfo((current) => ({ ...current, paymentFrequency: "BI_ANNUAL" }))}
                />
                Bi-Annual
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">
                <input
                  type="radio"
                  name="renewalPaymentFrequency"
                  value="QUARTERLY"
                  checked={info.paymentFrequency === "QUARTERLY"}
                  disabled={isReadOnly}
                  onChange={() => setInfo((current) => ({ ...current, paymentFrequency: "QUARTERLY" }))}
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
            description="Confirm the selected business, uploaded requirements, and readiness for final validation."
            action={
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={submitting || records.length === 0 || isReadOnly}
                  onClick={() => {
                    void persist("DRAFT");
                  }}
                  className={actionButtonStyles("secondary", "md")}
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={submitting || records.length === 0 || isReadOnly}
                  onClick={() => {
                    void persist("SUBMIT");
                  }}
                  className={actionButtonStyles("primary", "md")}
                >
                  Submit Renewal
                </button>
              </div>
            }
          >
            <div className="grid gap-4 md:grid-cols-3">
              <ReviewStat
                label="Business Name"
                value={info.businessName || "-"}
                helper="Loaded from the selected business record"
              />
              <ReviewStat
                label="Application Type"
                value="Renewal"
                helper="Renewal workflow behavior remains unchanged"
              />
              <ReviewStat
                label="Required Documents"
                value={`${uploadedRequiredCount} / ${requiredRenewalDocs.length}`}
                helper="Uploaded required document count"
              />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Before you submit</p>
              <ul className="mt-2 space-y-1">
                <li>• Verify the selected business record is correct.</li>
                <li>• Review editable contact and address details for updates.</li>
                <li>• Confirm the renewal document set is complete and readable.</li>
              </ul>
            </div>
          </SectionCard>

          {validationDetail ? <ValidationPanel detail={validationDetail} /> : null}
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
