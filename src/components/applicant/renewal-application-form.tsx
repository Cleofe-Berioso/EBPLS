"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { defaultBusinessInfo } from "@/lib/applicant-mock";
import { BusinessInformationFields } from "@/components/applicant/business-information-fields";
import { FormStepper } from "@/components/applicant/form-stepper";
import { UploadSlot } from "@/components/applicant/upload-slot";
import { resolveRequiredDocuments } from "@/lib/required-documents";
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
    title: "Assessment Preview",
    description: "Review the estimated renewal charges before final review.",
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
  const [statusMessage, setStatusMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [validationDetail, setValidationDetail] = useState<SubmitValidationErrorDetail | null>(null);

  const requiredRenewalDocs = useMemo(
    () =>
      resolveRequiredDocuments({
        applicationType: "RENEWAL",
        formData: info,
      }),
    [info]
  );

  const uploadedRequiredCount = requiredRenewalDocs.filter((doc) => uploadedDocuments[doc]).length;
  const selectedRecord = records.find((item) => item.id === selectedBusinessId);

  useEffect(() => {
    let active = true;

    async function loadRecords() {
      const response = await fetch("/api/applicant/business-records", { cache: "no-store" });
      const data = (await response.json()) as {
        records?: Array<{ id: string; registrationNumber: string; businessName: string; businessInfo: BusinessInfo }>;
      };

      if (!active || !response.ok || !data.records) return;

      setRecords(data.records);
      if (data.records[0] && !selectedBusinessId) {
        setSelectedBusinessId(data.records[0].id);
        setInfo(data.records[0].businessInfo);
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
      setInfo(data.application.formData);
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
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function back() {
    setStep((current) => Math.max(current - 1, 0));
  }

  async function persist(mode: PersistMode) {
    setSubmitting(true);
    setStatusMessage(null);
    setValidationDetail(null);

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
    };
    setSubmitting(false);

    if (!response.ok || !data.application) {
      setStatusMessage({
        kind: "error",
        text: data.error ?? "Unable to save renewal application.",
      });
      if (data.detail) setValidationDetail(data.detail);
      return null;
    }

    setApplicationId(data.application.id);
    setStatusMessage({
      kind: "success",
      text:
        mode === "SUBMIT"
          ? `Renewal ${data.application.applicationNumber} submitted successfully.`
          : `Renewal draft ${data.application.applicationNumber} saved successfully.`,
    });
    return data.application.id;
  }

  async function ensureApplicationId(): Promise<string | null> {
    if (applicationId) return applicationId;
    return persist("DRAFT");
  }

  async function handleDocumentUpload(documentName: string, file: File | null) {
    if (!file) return;

    const ensuredId = await ensureApplicationId();
    if (!ensuredId) return;

    setSubmitting(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append("documentName", documentName);
    formData.append("file", file);

    const response = await fetch(`/api/applicant/applications/${ensuredId}/documents`, {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as {
      document?: ApplicationDocumentInput;
      error?: string;
    };

    setSubmitting(false);

    if (!response.ok || !data.document) {
      setStatusMessage({
        kind: "error",
        text: data.error ?? "Unable to upload document.",
      });
      return;
    }

    const uploadedDoc = data.document;

    setUploadedDocuments((current) => ({
      ...current,
      [documentName]: uploadedDoc,
    }));
    setStatusMessage({
      kind: "success",
      text: `${documentName} uploaded.`,
    });
  }

  async function handleDocumentDelete(documentName: string) {
    const doc = uploadedDocuments[documentName];
    if (!doc?.id || !applicationId) return;

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

      {step === 0 ? (
        <SectionCard
          title="Select Existing Business"
          description="Renewal starts from a registered business record. Core registration fields stay locked to preserve the existing record."
        >
          {records.length === 0 ? (
            <EmptyState
              title="No records available yet"
              description="No action is required right now. This renewal form will populate once you have an existing business record."
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
                    if (selected) setInfo(selected.businessInfo);
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
              onChange={setInfo}
              lockedFields={lockedFields}
            />
          </SectionCard>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <InfoBanner
            title={`Required documents uploaded: ${uploadedRequiredCount} of ${requiredRenewalDocs.length}`}
            description="Zoning clearance is not required for renewal. Upload current, readable copies of the remaining requirements."
            variant="info"
          />
          <SectionCard
            title="Upload Renewal Documents"
            description="Conditional clearances may appear depending on the line of business and recorded activity."
          >
            <div className="grid gap-3 md:grid-cols-2">
              {requiredRenewalDocs.map((doc) => (
                <UploadSlot
                  key={doc}
                  label={doc}
                  required
                  helperText="Upload the latest valid copy for renewal review."
                  disabled={submitting || records.length === 0}
                  fileName={uploadedDocuments[doc]?.fileName}
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

      {step === 3 ? (
        <div className="space-y-4">
          <InfoBanner
            title="Assessment preview only"
            description="This screen shows an estimated renewal total for applicant guidance. Final assessment remains part of the BPLO review and TOP generation process."
            variant="warning"
          />
          <SectionCard
            title="Assessment Preview"
            description="Use this preview to understand possible late-renewal charges before final review."
          >
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-gray-800">
              <div className="flex justify-between py-1">
                <span>Permit Fee</span>
                <span>Php 2,400.00</span>
              </div>
              <div className="flex justify-between py-1">
                <span>25% Surcharge for late renewal</span>
                <span>Php 600.00</span>
              </div>
              <div className="flex justify-between py-1">
                <span>2% Monthly Interest</span>
                <span>Php 96.00</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-green-200 pt-2 font-semibold text-green-800">
                <span>Total Amount</span>
                <span>Php 3,096.00</span>
              </div>
            </div>
          </SectionCard>
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
