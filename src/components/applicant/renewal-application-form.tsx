"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { defaultBusinessInfo } from "@/lib/applicant-mock";
import { normalizeBusinessInfo as normalizeBusinessInfoRules } from "@/lib/business-rules";
import { isWithinEbMagalona } from "@/lib/business-location";
import { validateBusinessIdentityFormats } from "@/lib/business-rules";
import { BusinessInformationFields } from "@/components/applicant/business-information-fields";
import { FormStepper } from "@/components/applicant/form-stepper";
import { UploadSlot } from "@/components/applicant/upload-slot";
import { normalizeDocumentName, resolveRequiredDocuments } from "@/lib/required-documents";
import type {
  ApplicationDocumentInput,
  BusinessInfo,
  PersistMode,
  SaveApplicationInput,
  SubmitValidationErrorDetail,
} from "@/lib/applicant-types";
import { actionButtonStyles } from "@/components/ui/action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { InfoBanner } from "@/components/ui/info-banner";
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
  "nationality",
];

function normalizeBusinessInfo(next: BusinessInfo): BusinessInfo {
  return normalizeBusinessInfoRules(next);
}

const BUSINESS_LOCATION_ERROR = "Please pin the business location inside EB Magalona.";
const RENEWAL_REVOKED_MESSAGE =
  "Renewal is not allowed because this business permit has been revoked. Re-application is required.";

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

export function RenewalApplicationForm() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("applicationId");

  const [step, setStep] = useState(0);
  const [applicationId, setApplicationId] = useState<string | undefined>(editId ?? undefined);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [records, setRecords] = useState<
    Array<{ id: string; registrationNumber: string; businessName: string; businessInfo: BusinessInfo }>
  >([]);
  const [info, setInfo] = useState<BusinessInfo>(defaultBusinessInfo);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, ApplicationDocumentInput>>({});
  const [pendingDocuments, setPendingDocuments] = useState<Record<string, File>>({});
  const [statusMessage, setStatusMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [validationDetail, setValidationDetail] = useState<SubmitValidationErrorDetail | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof BusinessInfo, string>>>({});
  const [revokedBlockedCount, setRevokedBlockedCount] = useState(0);

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

  async function uploadPendingDocuments(nextApplicationId: string) {
    const documentsToUpload = Object.entries(pendingDocuments);

    for (const [documentName, file] of documentsToUpload) {
      const formData = new FormData();
      formData.append("documentName", documentName);
      formData.append("file", file);

      const response = await fetch(`/api/applicant/applications/${nextApplicationId}/documents`, {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        document?: ApplicationDocumentInput;
        error?: string;
      };

      if (!response.ok || !data.document) {
        setStatusMessage({
          kind: "error",
          text: data.error ?? `Application submitted, but ${documentName} could not be uploaded.`,
        });
        return false;
      }

      setUploadedDocuments((current) => ({
        ...current,
        [documentName]: data.document,
      }));
    }

    if (documentsToUpload.length > 0) {
      setPendingDocuments({});
    }

    return true;
  }

  useEffect(() => {
    let active = true;

    async function loadRecords() {
      const response = await fetch("/api/applicant/business-records", { cache: "no-store" });
      const data = (await response.json()) as {
        records?: Array<{ id: string; registrationNumber: string; businessName: string; businessInfo: BusinessInfo }>;
        revokedBlockedCount?: number;
      };

      if (!active || !response.ok || !data.records) return;

      setRecords(data.records);
      setRevokedBlockedCount(data.revokedBlockedCount ?? 0);
      if (data.records[0] && !selectedBusinessId) {
        setSelectedBusinessId(data.records[0].id);
          setInfo(
            normalizeBusinessInfo({
              ...defaultBusinessInfo,
              ...data.records[0].businessInfo,
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
          businessRecordId?: string;
          formData: BusinessInfo;
          documents: ApplicationDocumentInput[];
        };
      };

      if (!active || !response.ok || !data.application) return;

      setApplicationId(data.application.id);
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
    if (step === 0 && !selectedBusinessId) {
      setFieldErrors({ businessName: "Select an existing business record first." });
      setStatusMessage({ kind: "error", text: "Select an existing business record before proceeding." });
      return;
    }

    if (step === 1) {
      const nextErrors: Partial<Record<keyof BusinessInfo, string>> = {};
      if (!info.email.trim()) nextErrors.email = "Email is required.";
      if (!info.mainOfficeAddress.trim()) nextErrors.mainOfficeAddress = "Main Office Address is required.";
      if (!info.phone.trim()) nextErrors.phone = "Contact Number is required.";
      if (!info.businessAddress.trim()) {
        nextErrors.businessAddress = "Business Address is required.";
      }

      const identityFormats = validateBusinessIdentityFormats(info);
      if (info.registrationNumber.trim().length > 0 && !identityFormats.registrationNumber) {
        nextErrors.registrationNumber = "Wrong Format";
      }
      if (info.tin.trim().length > 0 && !identityFormats.tin) {
        nextErrors.tin = "Wrong Format";
      }

      Object.assign(nextErrors, validateBusinessLocation(info));

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
    setStep((current) => Math.max(current - 1, 0));
  }

  async function persist(mode: PersistMode) {
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
        text: revokedBlockedCount > 0
          ? RENEWAL_REVOKED_MESSAGE
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
    }

    const payload: SaveApplicationInput = {
      applicationId,
      applicationType: "RENEWAL",
      businessRecordId: selectedBusinessId || undefined,
      formData: info,
      documents: Object.values(uploadedDocuments),
      mode,
    };

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
      setSubmitting(false);
      return null;
    }

    setApplicationId(data.application.id);

    if (mode === "SUBMIT") {
      const uploaded = await uploadPendingDocuments(data.application.id);
      setSubmitting(false);

      if (!uploaded) {
        return data.application.id;
      }

      setStatusMessage({
        kind: "success",
        text: `Renewal ${data.application.applicationNumber} submitted successfully.`,
      });
      return data.application.id;
    }

    setSubmitting(false);
    setStatusMessage({
      kind: "success",
      text: `Renewal draft ${data.application.applicationNumber} saved successfully.`,
    });
    return data.application.id;
  }

  async function handleDocumentUpload(documentName: string, file: File | null) {
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
  }

  async function handleDocumentDelete(documentName: string) {
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
          title={statusMessage.kind === "success" ? "Renewal update" : "Renewal issue"}
          description={statusMessage.text}
          variant={statusMessage.kind === "success" ? "success" : "danger"}
        />
      ) : null}

      {step === 0 ? (
        <SectionCard
          title="Select Existing Business"
          description="Renewal starts from a registered business record. Core registration fields stay locked to preserve the existing record."
        >
          {records.length === 0 ? (
            <EmptyState
              title={revokedBlockedCount > 0 ? "No eligible renewal records" : "No records available yet"}
              description={
                revokedBlockedCount > 0
                  ? `${RENEWAL_REVOKED_MESSAGE} You may file a New Application to re-apply.`
                  : "No action is required right now. This renewal form will populate once you have an existing business record."
              }
            />
          ) : (
            <div className="space-y-4">
              <FormField
                label="Existing Business Record"
                hint="Choose which registered business record you want to renew."
                required
              >
                <select
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  value={selectedBusinessId}
                  disabled={records.length === 0}
                  onChange={(event) => {
                    const selectedId = event.target.value;
                    setSelectedBusinessId(selectedId);
                    const selected = records.find((item) => item.id === selectedId);
                    if (selected) {
                      setInfo(
                        normalizeBusinessInfo({
                          ...defaultBusinessInfo,
                          ...selected.businessInfo,
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

              {selectedRecord ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{selectedRecord.businessName}</p>
                  <p className="mt-1">Registration: {selectedRecord.registrationNumber}</p>
                  <p className="mt-1">Email: {selectedRecord.businessInfo.email}</p>
                </div>
              ) : null}
            </div>
          )}
        </SectionCard>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
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
                setInfo(normalizeBusinessInfo(nextInfo));
              }}
              lockedFields={lockedFields}
              fieldErrors={fieldErrors}
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
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <InfoBanner
            title={`Required documents uploaded: ${uploadedRequiredCount} of ${requiredRenewalDocs.length}`}
            description="Select files locally first, then the final submit will save the documents and timestamps."
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
                    disabled={submitting || records.length === 0}
                    fileName={uploadedDoc?.fileName}
                    uploadedAt={uploadedDoc?.uploadedAt}
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
        <div className="space-y-4">
          <SectionCard
            title="Preferred Payment Frequency"
            description="Choose how you prefer to pay the assessed fees. Final payment details are confirmed after BPLO assessment."
          >
            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">
                <input
                  type="radio"
                  name="renewalPaymentFrequency"
                  value="ANNUAL"
                  checked={info.paymentFrequency === "ANNUAL"}
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
                  disabled={submitting || records.length === 0}
                  onClick={() => {
                    void persist("DRAFT");
                  }}
                  className={actionButtonStyles("secondary", "md")}
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={submitting || records.length === 0}
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
          disabled={step === 0}
          onClick={back}
          className={actionButtonStyles("ghost", "md")}
        >
          Back
        </button>
        <button
          type="button"
          disabled={step === steps.length - 1}
          onClick={next}
          className={actionButtonStyles("primary", "md")}
        >
          Next
        </button>
      </div>
    </div>
  );
}
