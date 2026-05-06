"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { actionButtonStyles } from "@/components/ui/action-button";
import { FormField } from "@/components/ui/form-field";
import { InfoBanner } from "@/components/ui/info-banner";
import { SectionCard } from "@/components/ui/section-card";

interface BploReviewActionsProps {
  applicationId: string;
  currentStatus: string;
}

const ACTIONS_BY_STATUS: Record<string, Array<{ action: string; label: string; requiresRemarks: boolean; variant: "primary" | "warning" | "danger" }>> = {
  Submitted: [
    { action: "under-review", label: "Mark Under Review", requiresRemarks: false, variant: "primary" },
    { action: "return", label: "Return for Correction", requiresRemarks: true, variant: "warning" },
    { action: "reject", label: "Reject Application", requiresRemarks: true, variant: "danger" },
  ],
  "Under Review": [
    { action: "approve-assessment", label: "Approve for Assessment", requiresRemarks: false, variant: "primary" },
    { action: "return", label: "Return for Correction", requiresRemarks: true, variant: "warning" },
    { action: "reject", label: "Reject Application", requiresRemarks: true, variant: "danger" },
  ],
};

export function BploReviewActions({ applicationId, currentStatus }: BploReviewActionsProps) {
  const router = useRouter();
  const [remarks, setRemarks] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const actions = ACTIONS_BY_STATUS[currentStatus] ?? [];

  async function runAction(action: string, requiresRemarks: boolean) {
    if (requiresRemarks && !remarks.trim()) {
      setMessage("Remarks are required for this action.");
      return;
    }

    setPendingAction(action);
    setMessage("");

    const response = await fetch(`/api/bplo/applications/${applicationId}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remarks }),
    });

    const data = (await response.json()) as { error?: string; application?: { applicationNumber: string } };

    if (!response.ok) {
      setMessage(data.error ?? "Unable to perform action.");
      setPendingAction(null);
      return;
    }

    setMessage(`Action applied to ${data.application?.applicationNumber ?? "application"}.`);
    setPendingAction(null);
    setRemarks("");
    router.refresh();
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
        <FormField
          label="Remarks"
          hint="Required for return and reject actions; stored in application history."
        >
          <textarea
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
            rows={3}
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder="Required for return and reject actions. Saved into application history."
          />
        </FormField>

        <InfoBanner
          title="Action guardrails"
          description="Available buttons are status-based. This panel does not introduce new statuses or workflow transitions."
          variant="readOnly"
        />

        <div className="rounded-xl border border-slate-200 bg-slate-50/85 p-3">
          <div className="flex flex-wrap gap-2">
          {actions.map((item) => (
            <button
              key={item.action}
              type="button"
              disabled={pendingAction !== null}
              onClick={() => runAction(item.action, item.requiresRemarks)}
              className={actionButtonStyles(item.variant, "sm")}
            >
              {pendingAction === item.action ? "Processing..." : item.label}
            </button>
          ))}
          </div>
        </div>

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
