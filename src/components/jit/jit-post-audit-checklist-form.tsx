"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  jitChecklistCardClass,
  jitFormControlClass,
  jitSummaryLabelClass,
} from "@/components/jit/jit-ui-styles";
import { SectionCard } from "@/components/ui/section-card";
import {
  JIT_CHECKLIST_RESPONSE_OPTIONS,
  JIT_POST_AUDIT_CHECKLIST_ITEMS,
  type JitChecklistDepartmentKey,
  type JitChecklistResponseValue,
} from "@/lib/jit-post-audit-checklist";

export interface ChecklistDraftItem {
  response: JitChecklistResponseValue | "";
  remarks: string;
  evidenceFile: File | null;
}

export type ChecklistDraftState = Record<JitChecklistDepartmentKey, ChecklistDraftItem>;

export function createEmptyChecklistDraft(): ChecklistDraftState {
  return JIT_POST_AUDIT_CHECKLIST_ITEMS.reduce<ChecklistDraftState>((acc, item) => {
    acc[item.departmentKey] = { response: "", remarks: "", evidenceFile: null };
    return acc;
  }, {} as ChecklistDraftState);
}

export function isChecklistComplete(draft: ChecklistDraftState): boolean {
  return JIT_POST_AUDIT_CHECKLIST_ITEMS.every((item) => draft[item.departmentKey]?.response !== "");
}

export function JitPostAuditChecklistForm({
  draft,
  onChange,
  disabled,
}: {
  draft: ChecklistDraftState;
  onChange: (next: ChecklistDraftState) => void;
  disabled?: boolean;
}) {
  const [expandedItems, setExpandedItems] = useState<Set<JitChecklistDepartmentKey>>(new Set());

  function updateItem(departmentKey: JitChecklistDepartmentKey, patch: Partial<ChecklistDraftItem>) {
    onChange({
      ...draft,
      [departmentKey]: {
        ...draft[departmentKey],
        ...patch,
      },
    });
  }

  function toggleExpand(departmentKey: JitChecklistDepartmentKey) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(departmentKey)) {
        next.delete(departmentKey);
      } else {
        next.add(departmentKey);
      }
      return next;
    });
  }

  return (
    <SectionCard
      title="Post-Audit Checklist"
      description="Answer Yes or No for each department before submitting the inspection."
    >
      <div className="space-y-2">
        {JIT_POST_AUDIT_CHECKLIST_ITEMS.map((item) => {
          const entry = draft[item.departmentKey];
          const isExpanded = expandedItems.has(item.departmentKey);
          const hasRemarksOrEvidence = Boolean(entry.remarks.trim() || entry.evidenceFile);

          return (
            <article key={item.departmentKey} className={jitChecklistCardClass}>
              {/* Compact header: department + question + response radios */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className={`${jitSummaryLabelClass} text-[var(--primary)]`}>
                    {item.departmentLabel}
                  </p>
                  <p className="mt-1 text-sm text-[var(--foreground)]">{item.question}</p>
                </div>

                {/* Yes / No radio buttons */}
                <div className="flex items-center gap-3 sm:ml-4 sm:shrink-0 sm:pt-1">
                  {JIT_CHECKLIST_RESPONSE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="inline-flex cursor-pointer items-center gap-1.5 text-sm"
                    >
                      <input
                        type="radio"
                        name={`checklist-${item.departmentKey}`}
                        disabled={disabled}
                        checked={entry.response === option.value}
                        onChange={() =>
                          updateItem(item.departmentKey, {
                            response: option.value,
                          })
                        }
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      <span
                        className={`font-medium ${
                          entry.response === option.value
                            ? "text-[var(--foreground)]"
                            : "text-[var(--ink-muted)]"
                        }`}
                      >
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Expandable remarks / evidence section */}
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => toggleExpand(item.departmentKey)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  {hasRemarksOrEvidence
                    ? "Remarks / evidence added"
                    : "Add remarks or evidence"}
                </button>

                {isExpanded && (
                  <div className="mt-2 grid gap-2 lg:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`checklist-remarks-${item.departmentKey}`}
                        className="mb-1 block text-xs font-medium text-[var(--ink-muted)]"
                      >
                        Remarks
                      </label>
                      <textarea
                        id={`checklist-remarks-${item.departmentKey}`}
                        disabled={disabled}
                        rows={2}
                        value={entry.remarks}
                        onChange={(event) =>
                          updateItem(item.departmentKey, { remarks: event.target.value })
                        }
                        className={jitFormControlClass}
                        placeholder="Optional remarks"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`checklist-evidence-${item.departmentKey}`}
                        className="mb-1 block text-xs font-medium text-[var(--ink-muted)]"
                      >
                        Photo Evidence (optional)
                      </label>
                      <input
                        id={`checklist-evidence-${item.departmentKey}`}
                        type="file"
                        disabled={disabled}
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(event) =>
                          updateItem(item.departmentKey, {
                            evidenceFile: event.target.files?.[0] ?? null,
                          })
                        }
                        className={jitFormControlClass}
                      />
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </SectionCard>
  );
}
