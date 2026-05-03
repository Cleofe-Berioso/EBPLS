"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { defaultBusinessInfo } from "@/lib/applicant-mock";
import type {
  ApplicationDocumentInput,
  BusinessInfo,
  PersistMode,
  PropertyOwnership,
  SaveApplicationInput,
  SubmitValidationErrorDetail,
} from "@/lib/applicant-types";
import { resolveRequiredDocuments } from "@/lib/required-documents";
import { BusinessInformationFields } from "@/components/applicant/business-information-fields";
import { FormStepper } from "@/components/applicant/form-stepper";
import { UploadSlot } from "@/components/applicant/upload-slot";
import { actionButtonStyles } from "@/components/ui/action-button";
import { FormField } from "@/components/ui/form-field";
import { InfoBanner } from "@/components/ui/info-banner";
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
    title: "Assessment Preview",
    description: "Review the estimated fee breakdown before final review.",
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
  { label: "Tax Incentives", key: "taxIncentives", helperText: "Enter None if not applicable." },
  { label: "Business Activity", key: "businessActivity" },
  { label: "Line of Business", key: "lineOfBusiness" },
  { label: "Asset Size", key: "assetSize", helperText: "Use the declared amount in pesos." },
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

function FieldCard({
  label,
  value,
  onChange,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
}) {
  return (
    <FormField label={label} required hint={helperText}>
      <input
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  );
}

export function NewApplicationForm() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("applicationId");

  const [step, setStep] = useState(0);
  const [info, setInfo] = useState<BusinessInfo>(defaultBusinessInfo);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, ApplicationDocumentInput>>({});
  const [applicationId, setApplicationId] = useState<string | undefined>(editId ?? undefined);
  const [statusMessage, setStatusMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [validationDetail, setValidationDetail] = useState<SubmitValidationErrorDetail | null>(null);

  const requiredDocs = useMemo(
    () =>
      resolveRequiredDocuments({
        applicationType: "NEW",
        formData: info,
      }),
    [info]
  );

  const uploadedRequiredCount = requiredDocs.filter((doc) => uploadedDocuments[doc]).length;

  useEffect(() => {
    let active = true;

    async function loadExistingApplication() {
      if (!editId) return;

      const response = await fetch(`/api/applicant/applications/${editId}`, { cache: "no-store" });
      const data = (await response.json()) as {
        application?: {
          id: string;
          formData: BusinessInfo;
          documents: ApplicationDocumentInput[];
        };
      };

      if (!active || !response.ok || !data.application) return;

      setApplicationId(data.application.id);
      setInfo(data.application.formData);
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
      applicationType: "NEW",
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
        text: data.error ?? "Unable to save application.",
      });
      if (data.detail) setValidationDetail(data.detail);
      return null;
    }

    setApplicationId(data.application.id);
    setStatusMessage({
      kind: "success",
      text:
        mode === "SUBMIT"
          ? `Application ${data.application.applicationNumber} submitted successfully.`
          : `Draft ${data.application.applicationNumber} saved successfully.`,
    });
    return data.application.id;
  }

  async function ensureApplicationId(): Promise<string | null> {
    if (applicationId) return applicationId;
    return persist("DRAFT");
  }

  async function handleDocumentUpload(documentName: string, file: File | null) {
    if (!file) return;

    setSubmitting(true);
    setStatusMessage(null);

    const ensuredId = await ensureApplicationId();
    if (!ensuredId) {
      setSubmitting(false);
      return;
    }

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
    if (!doc?.id || !applicationId) {
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
          title={statusMessage.kind === "success" ? "Application update" : "Application issue"}
          description={statusMessage.text}
          variant={statusMessage.kind === "success" ? "success" : "danger"}
        />
      ) : null}

      {step === 0 ? (
        <SectionCard
          title="Business Information"
          description="Fields marked with an asterisk are required for draft saving and final submission."
        >
          <BusinessInformationFields value={info} onChange={setInfo} />
        </SectionCard>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
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
                  onChange={(value) =>
                    setInfo((current) => ({ ...current, [field.key]: value }))
                  }
                />
              ))}
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
                    setInfo((current) => ({
                      ...current,
                      propertyOwnership: event.target.value as PropertyOwnership,
                    }))
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
                    onChange={(value) =>
                      setInfo((current) => ({ ...current, taxDeclarationNumber: value }))
                    }
                  />
                  <FieldCard
                    label="Property Identification Number"
                    value={info.propertyIdentificationNumber}
                    onChange={(value) =>
                      setInfo((current) => ({
                        ...current,
                        propertyIdentificationNumber: value,
                      }))
                    }
                  />
                </>
              ) : null}
            </div>
          </SectionCard>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <InfoBanner
            title={`Required documents uploaded: ${uploadedRequiredCount} of ${requiredDocs.length}`}
            description="Upload clear, readable files for every listed requirement. Draft save and upload behavior stays unchanged."
            variant="info"
          />
          <SectionCard
            title="Document Upload"
            description="Required files may vary based on business type and property ownership."
          >
            <div className="grid gap-3 md:grid-cols-2">
              {requiredDocs.map((doc) => (
                <UploadSlot
                  key={doc}
                  label={doc}
                  required
                  helperText="Prepare a clear file copy before uploading."
                  disabled={submitting}
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
            description="These estimated amounts are shown for applicant guidance. Final assessment is still determined during BPLO fee assessment."
            variant="warning"
          />
          <SectionCard
            title="Assessment Preview"
            description="Use this section to review the current estimated amounts before final review."
          >
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-gray-800">
              <div className="flex justify-between py-1">
                <span>Mayor&apos;s Permit Fee</span>
                <span>Php 2,000.00</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Regulatory Fees</span>
                <span>Php 1,250.00</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Additional Charges</span>
                <span>Php 500.00</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Penalties</span>
                <span>Php 0.00</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-green-200 pt-2 font-semibold text-green-800">
                <span>Total Amount</span>
                <span>Php 3,750.00</span>
              </div>
            </div>
          </SectionCard>
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
                  disabled={submitting}
                  onClick={() => {
                    void persist("DRAFT");
                  }}
                  className={actionButtonStyles("secondary", "md")}
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={submitting}
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
