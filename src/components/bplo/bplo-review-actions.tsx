"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bploFormControlClass, bploPanelClass } from "@/components/bplo/bplo-ui-styles";
import { actionButtonStyles } from "@/components/ui/action-button";
import { FormField } from "@/components/ui/form-field";
import { InfoBanner } from "@/components/ui/info-banner";
import { SectionCard } from "@/components/ui/section-card";

interface BploReviewActionsProps {
  applicationId: string;
  currentStatus: string;
  approvalBlocked?: boolean;
  approvalBlockMessage?: string;
}

const ACTIONS_BY_STATUS: Record<string, Array<{ action: string; label: string; requiresRemarks: boolean; variant: "primary" | "warning" | "danger" }>> = {
  Submitted: [
    { action: "under-review", label: "Mark Under Review", requiresRemarks: false, variant: "primary" },
    { action: "return", label: "Return for Correction", requiresRemarks: true, variant: "warning" },
    { action: "reject", label: "Reject Application", requiresRemarks: true, variant: "danger" },
  ],
  "Under Review": [
    { action: "approve-assessment", label: "Send to Department Head Review", requiresRemarks: false, variant: "primary" },
    { action: "return", label: "Return for Correction", requiresRemarks: true, variant: "warning" },
    { action: "reject", label: "Reject Application", requiresRemarks: true, variant: "danger" },
  ],
};

export function BploReviewActions({
  applicationId,
  currentStatus,
  approvalBlocked = false,
  approvalBlockMessage,
}: BploReviewActionsProps) {
  const router = useRouter();
  const [remarks, setRemarks] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const actions = ACTIONS_BY_STATUS[currentStatus] ?? [];

  async function runAction(action: string, requiresRemarks: boolean) {
    if (pendingAction) return;

    if (action === "approve-assessment" && approvalBlocked) {
      setMessage(approvalBlockMessage ?? "All required documents must be marked Valid before approval.");
      return;
    }

    if (requiresRemarks && !remarks.trim()) {
      setMessage("Remarks are required for this action.");
      return;
    }

    setPendingAction(action);
    setMessage("");

    try {
      const response = await fetch(`/api/bplo/applications/${applicationId}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        credentials: "same-origin",
        body: JSON.stringify({ remarks }),
      });

      let data: {
        error?: string;
        application?: { applicationNumber: string; status?: string };
      } = {};

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = (await response.json()) as typeof data;
      } else if (!response.ok) {
        throw new Error(`Unable to perform action (HTTP ${response.status}).`);
      }

      if (!response.ok) {
        setMessage(data.error ?? "Unable to perform action.");
        return;
      }

      const applicationNumber = data.application?.applicationNumber ?? "application";
      const nextStatus = data.application?.status;
      setMessage(
        action === "approve-assessment"
          ? `${applicationNumber} sent to Department Head Review${nextStatus ? ` (${nextStatus})` : ""}. Open Department Head → Application Approvals to continue.`
          : nextStatus
            ? `${applicationNumber} moved to ${nextStatus}.`
            : `Action applied to ${applicationNumber}.`
      );
      setRemarks("");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to perform action.");
    } finally {
      setPendingAction(null);
    }
  }

  if (actions.length === 0) {
    return (
      <SectionCard title="Review Actions" description="No operational review action is available for the current status.">
        <InfoBanner
          title="No action available"
          description="This application is outside the Submitted and Under Review decision stages."
          variant="readOnly"
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Review Actions" description="Operational actions below follow the existing BPLO review workflow only.">
      <div className="space-y-4">
        <div className={`relative z-10 ${bploPanelClass}`}>
          <div className="flex flex-wrap gap-2">
            {actions.map((item) => {
              const blockedByDocuments = item.action === "approve-assessment" && approvalBlocked;
              const isBusy = pendingAction !== null && pendingAction !== item.action;
              return (
                <button
                  key={item.action}
                  type="button"
                  disabled={isBusy || blockedByDocuments}
                  aria-busy={pendingAction === item.action}
                  onClick={() => void runAction(item.action, item.requiresRemarks)}
                  className={actionButtonStyles(item.variant, "sm")}
                >
                  {pendingAction === item.action ? "Processing..." : item.label}
                </button>
              );
            })}
          </div>
        </div>

        <FormField
          label="Remarks"
          hint="Required for return and reject actions; stored in application history."
        >
          <textarea
            aria-label="Remarks"
            className={bploFormControlClass}
            rows={3}
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder="Required for return and reject actions. Saved into application history."
          />
        </FormField>

        {approvalBlocked ? (
          <InfoBanner
            title="Approval blocked by document validation"
            description={
              approvalBlockMessage ??
              "All required documents must be marked Valid before sending this application to Department Head review."
            }
            variant="danger"
          />
        ) : null}

        {message ? (
          <InfoBanner
            title={message.includes("Unable") || message.includes("required") ? "Action blocked" : "Action update"}
            description={message}
            variant={message.includes("Unable") || message.includes("required") ? "danger" : "success"}
          />
        ) : null}
      </div>
    </SectionCard>
  );
}
