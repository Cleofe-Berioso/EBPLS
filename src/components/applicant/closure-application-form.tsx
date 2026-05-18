"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { defaultBusinessInfo } from "@/lib/applicant-mock";
import { FormStepper } from "@/components/applicant/form-stepper";
import { UploadSlot } from "@/components/applicant/upload-slot";
import { getMissingRequiredDocuments, resolveRequiredDocuments } from "@/lib/required-documents";
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
    title: "Select Business to Close",
    description: "Choose the registered business record for closure.",
  },
  {
    title: "Upload Requirements",
    description: "Attach closure documents and proof of ceased operations.",
  },
  {
    title: "Review and Submit",
    description: "Confirm the closure package before final validation.",
  },
];

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

type ClosureRecord = {
  id: string;
  registrationNumber: string;
  businessName: string;
  businessInfo: BusinessInfo;
  closureEligibility: {
    eligible: boolean;
    isComplianceForcedClosure: boolean;
    reasonCode: string | null;
    userFriendlyReason: string | null;
    blockingInspectionId: string | null;
    complianceCaseStatus: string | null;
    nonComplianceType: string | null;
  };
};

type ClosureTypeValue = "RETIREMENT" | "NON_COMPLIANT_RELATED" | "OTHERS" | "";

const CLOSURE_TYPE_OPTIONS: Array<{ value: ClosureTypeValue; label: string }> = [
  { value: "RETIREMENT", label: "Retirement" },
  { value: "NON_COMPLIANT_RELATED", label: "Non-compliant Related" },
  { value: "OTHERS", label: "Others" },
];

function isComplianceForcedClosureRecord(record: ClosureRecord | undefined) {
  return Boolean(record?.closureEligibility.isComplianceForcedClosure);
}

function humanizeClosureEligibilityReason(record: ClosureRecord | undefined): string | null {
  return record?.closureEligibility.userFriendlyReason ?? null;
}

export function ClosureApplicationForm() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("applicationId");

  const [step, setStep] = useState(0);
  const [applicationId, setApplicationId] = useState<string | undefined>(editId ?? undefined);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [records, setRecords] = useState<
    ClosureRecord[]
  >([]);
  const [selectedBusinessName, setSelectedBusinessName] = useState(defaultBusinessInfo.businessName);
  const [selectedBusinessInfo, setSelectedBusinessInfo] = useState<BusinessInfo>(defaultBusinessInfo);
  const [closureType, setClosureType] = useState<ClosureTypeValue>("");
  const [closureTypeOtherReason, setClosureTypeOtherReason] = useState("");
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, ApplicationDocumentInput>>({});
  const [pendingDocuments, setPendingDocuments] = useState<Record<string, File>>({});
  const [statusMessage, setStatusMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [validationDetail, setValidationDetail] = useState<SubmitValidationErrorDetail | null>(null);

  const requiredDocs = useMemo(
    () =>
      resolveRequiredDocuments({
        applicationType: "CLOSURE",
        formData: selectedBusinessInfo,
      }),
    [selectedBusinessInfo]
  );

  const uploadedRequiredCount = requiredDocs.filter((doc) => uploadedDocuments[doc]).length;
  const selectedRecord = records.find((item) => item.id === selectedBusinessId);
  const isComplianceForcedClosure = isComplianceForcedClosureRecord(selectedRecord);

  useEffect(() => {
    if (!isComplianceForcedClosure) return;
    if (closureType === "NON_COMPLIANT_RELATED") return;

    setClosureType("NON_COMPLIANT_RELATED");
    setClosureTypeOtherReason("");
  }, [closureType, isComplianceForcedClosure]);

  useEffect(() => {
    let active = true;

    async function loadRecords() {
      const response = await fetch("/api/applicant/business-records?applicationType=CLOSURE", { cache: "no-store" });
      const data = (await response.json()) as {
        records?: ClosureRecord[];
        complianceForcedRecords?: ClosureRecord[];
      };

      if (!active || !response.ok || !data.records) return;

      setRecords(data.records);
      if (data.records[0] && !selectedBusinessId) {
        setSelectedBusinessId(data.records[0].id);
        setSelectedBusinessName(data.records[0].businessName);
        setSelectedBusinessInfo({
          ...defaultBusinessInfo,
          ...data.records[0].businessInfo,
          paymentFrequency: data.records[0].businessInfo.paymentFrequency ?? "ANNUAL",
        });
        if (data.records[0].closureEligibility.isComplianceForcedClosure) {
          setClosureType("NON_COMPLIANT_RELATED");
          setClosureTypeOtherReason("");
        }
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
          closureType?: ClosureTypeValue;
          closureTypeOtherReason?: string | null;
          documents: ApplicationDocumentInput[];
        };
      };

      if (!active || !response.ok || !data.application) return;

      setApplicationId(data.application.id);
      setSelectedBusinessInfo({
        ...defaultBusinessInfo,
        ...data.application.formData,
        paymentFrequency: data.application.formData.paymentFrequency ?? "ANNUAL",
      });
      setSelectedBusinessName(data.application.formData.businessName);
      setClosureType(data.application.closureType ?? "");
      setClosureTypeOtherReason(data.application.closureTypeOtherReason ?? "");
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
      setStatusMessage({ kind: "error", text: "Select an existing business record before proceeding." });
      return;
    }

    if (step === 0) {
      if (!closureType) {
        setStatusMessage({ kind: "error", text: "Closure type is required." });
        return;
      }

      if (closureType === "OTHERS" && !closureTypeOtherReason.trim()) {
        setStatusMessage({ kind: "error", text: "Please specify the closure reason for Others." });
        return;
      }

      if (isComplianceForcedClosure && closureType !== "NON_COMPLIANT_RELATED") {
        setStatusMessage({ kind: "error", text: "This business requires non-compliant related closure processing." });
        return;
      }
    }

    if (step === 1 && requiredDocs.length > 0 && uploadedRequiredCount < requiredDocs.length) {
      setStatusMessage({
        kind: "error",
        text: "Upload all required closure documents before moving to review.",
      });
      return;
    }

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

    if (mode === "SUBMIT") {
      if (!closureType) {
        setStatusMessage({ kind: "error", text: "Closure type is required." });
        setSubmitting(false);
        return null;
      }

      if (closureType === "OTHERS" && !closureTypeOtherReason.trim()) {
        setStatusMessage({ kind: "error", text: "Please specify the closure reason for Others." });
        setSubmitting(false);
        return null;
      }

      if (isComplianceForcedClosure && closureType !== "NON_COMPLIANT_RELATED") {
        setStatusMessage({ kind: "error", text: "This business requires non-compliant related closure processing." });
        setSubmitting(false);
        return null;
      }

      const missingDocuments = getMissingRequiredDocuments(requiredDocs, [
        ...Object.values(uploadedDocuments).map((doc) => doc.documentName),
        ...Object.keys(pendingDocuments),
      ]);

      if (missingDocuments.length > 0) {
        setStep(1);
        setValidationDetail({ missingFields: [], missingDocuments });
        setStatusMessage({
          kind: "error",
          text: "Upload all required closure documents before submitting.",
        });
        setSubmitting(false);
        return null;
      }
    }

    const selected = records.find((item) => item.id === selectedBusinessId);
    const payload: SaveApplicationInput = {
      applicationId,
      applicationType: "CLOSURE",
      businessRecordId: selectedBusinessId || undefined,
      closureType: closureType || undefined,
      closureTypeOtherReason: closureTypeOtherReason.trim() || undefined,
      formData: selected?.businessInfo ?? selectedBusinessInfo,
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
      detail?: SubmitValidationErrorDetail;
    };
    setSubmitting(false);

    if (!response.ok || !data.application) {
      setStatusMessage({
        kind: "error",
        text: data.error ?? "Unable to save closure application.",
      });
      if (data.detail) setValidationDetail(data.detail);
      return null;
    }

    setApplicationId(data.application.id);

    if (mode === "SUBMIT") {
      setPendingDocuments({});

      setStatusMessage({
        kind: "success",
        text: `Closure ${data.application.applicationNumber} submitted successfully.`,
      });
      return data.application.id;
    }

    setStatusMessage({
      kind: "success",
      text: `Closure draft ${data.application.applicationNumber} saved successfully.`,
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
          title={statusMessage.kind === "success" ? "Closure update" : "Closure issue"}
          description={statusMessage.text}
          variant={statusMessage.kind === "success" ? "success" : "danger"}
        />
      ) : null}

      {step === 0 ? (
        <SectionCard
          title="Select Business to Close"
          description="Closure starts from an existing registered business record so the correct business history is preserved."
        >
          {records.length === 0 ? (
            <EmptyState
              title="No records available yet"
              description="No action is required right now. This closure form will populate once you have an existing business record."
            />
          ) : (
            <div className="space-y-4">
              <FormField
                label="Existing Business Record"
                hint="Choose the registered business record that will be closed."
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
                      setSelectedBusinessName(selected.businessName);
                      setSelectedBusinessInfo({
                        ...defaultBusinessInfo,
                        ...selected.businessInfo,
                        paymentFrequency: selected.businessInfo.paymentFrequency ?? "ANNUAL",
                      });
                      if (selected.closureEligibility.isComplianceForcedClosure) {
                        setClosureType("NON_COMPLIANT_RELATED");
                        setClosureTypeOtherReason("");
                      } else {
                        setClosureType("");
                        setClosureTypeOtherReason("");
                      }
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

              <FormField
                label="Closure Type"
                hint={
                  isComplianceForcedClosure
                    ? "This business has a compliance-related restriction and must complete closure processing."
                    : "Select the closure type that best matches this filing."
                }
                required
              >
                <select
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  value={closureType}
                  disabled={isComplianceForcedClosure}
                  onChange={(event) => setClosureType(event.target.value as ClosureTypeValue)}
                >
                  <option value="">Select closure type</option>
                  {CLOSURE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {isComplianceForcedClosure ? (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    This business requires closure processing because of a compliance-related restriction.
                  </p>
                ) : null}
              </FormField>

              {closureType === "OTHERS" ? (
                <FormField
                  label="Please specify"
                  hint="Provide a short reason for selecting Others."
                  required
                >
                  <textarea
                    className="min-h-[96px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                    value={closureTypeOtherReason}
                    onChange={(event) => setClosureTypeOtherReason(event.target.value)}
                    placeholder="Describe the closure reason"
                    disabled={isComplianceForcedClosure}
                  />
                </FormField>
              ) : null}

              {selectedRecord ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{selectedRecord.businessName}</p>
                  <p className="mt-1">Registration: {selectedRecord.registrationNumber}</p>
                  <p className="mt-1">Business Type: {selectedRecord.businessInfo.businessType}</p>
                  {humanizeClosureEligibilityReason(selectedRecord) ? (
                    <p className="mt-1 text-xs text-amber-700">{humanizeClosureEligibilityReason(selectedRecord)}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </SectionCard>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          <InfoBanner
            title={`Required documents uploaded: ${uploadedRequiredCount} of ${requiredDocs.length}`}
            description="Select files locally first, then the final submit will save the documents and timestamps."
            variant="info"
          />
          <SectionCard
            title="Upload Requirements"
            description="These documents support closure review and later settlement checking."
          >
            <div className="grid gap-3 md:grid-cols-2">
              {requiredDocs.map((doc) => (
                <UploadSlot
                  key={doc}
                  label={doc}
                  required
                  helperText="Upload a clear file that supports business closure review."
                  disabled={submitting || records.length === 0}
                  fileName={uploadedDocuments[doc]?.fileName}
                  uploadedAt={uploadedDocuments[doc]?.uploadedAt}
                  onFileChange={(file) => {
                    void handleDocumentUpload(doc, file);
                  }}
                  onRemove={() => {
                    void handleDocumentDelete(doc);
                  }}
                />
              ))}
            </div>
          </SectionCard>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <SectionCard
            title="Review and Submit"
            description="Confirm the selected business and uploaded closure requirements before running final validation."
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
                  Submit Closure
                </button>
              </div>
            }
          >
            <div className="grid gap-4 md:grid-cols-3">
              <ReviewStat
                label="Business Name"
                value={selectedBusinessName || "-"}
                helper="Selected from your registered business records"
              />
              <ReviewStat
                label="Application Type"
                value="Closure"
                helper="Closure workflow behavior remains unchanged"
              />
              <ReviewStat
                label="Closure Type"
                value={
                  closureType === "RETIREMENT"
                    ? "Retirement"
                    : closureType === "NON_COMPLIANT_RELATED"
                      ? "Non-compliant Related"
                      : closureType === "OTHERS"
                        ? "Others"
                        : "-"
                }
                helper={
                  closureType === "OTHERS"
                    ? closureTypeOtherReason.trim() || "Please specify required"
                    : isComplianceForcedClosure
                      ? "Locked because of compliance-related restriction"
                      : "Required before submission"
                }
              />
              <ReviewStat
                label="Required Documents"
                value={`${uploadedRequiredCount} / ${requiredDocs.length}`}
                helper="Uploaded required document count"
              />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Before you submit</p>
              <ul className="mt-2 space-y-1">
                <li>• Make sure the selected business record is the one being closed.</li>
                <li>• Confirm the closure type matches the reason for closure.</li>
                <li>• Confirm each closure requirement has a clear uploaded file.</li>
                <li>• Fees will be assessed by BPLO after application review.</li>
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
