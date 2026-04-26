"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { ApplicationTracker } from "@/components/dashboard/application-tracker";
import { formatDateTime } from "@/lib/utils";
import { Clock, ArrowRight, Radio, ChevronDown, ChevronUp } from "lucide-react";
import { useSSE } from "@/hooks/use-sse";
import { toast } from "sonner";
import type { SSEEvent } from "@/lib/sse";

interface HistoryEntry {
  id: string;
  newStatus: string;
  createdAt: string;
  comment: string | null;
}

interface ApplicationRow {
  id: string;
  applicationNumber: string;
  businessName: string;
  status: string;
  updatedAt: string;
  history: HistoryEntry[];
}

export function TrackingClient({ initialApplications }: { initialApplications: ApplicationRow[] }) {
  const [apps, setApps] = useState<ApplicationRow[]>(initialApplications);
  const [liveIds, setLiveIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set([initialApplications[0]?.id ?? ""]));

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStatusChange = useCallback((event: SSEEvent) => {
    if (event.type !== "application_status_changed") return;
    const { applicationId, applicationNumber, newStatus } = event.data as {
      applicationId: string; applicationNumber: string; newStatus: string;
    };

    setApps((prev) =>
      prev.map((app) => {
        if (app.id !== applicationId) return app;
        const syntheticEntry: HistoryEntry = {
          id: `live-${Date.now()}`,
          newStatus,
          createdAt: new Date().toISOString(),
          comment: "Status updated in real-time",
        };
        return {
          ...app,
          status: newStatus,
          history: [syntheticEntry, ...app.history].slice(0, 3),
        };
      })
    );
    setLiveIds((prev) => new Set([...prev, applicationId]));
    setExpandedIds((prev) => new Set([...prev, applicationId]));
    toast.info(
      `${applicationNumber} status changed to ${newStatus.replace(/_/g, " ")}`,
      { description: "Your application was just updated.", duration: 6000 }
    );
  }, []);

  useSSE({ application_status_changed: handleStatusChange });

  return (
    <div className="space-y-4">
      {/* Live indicator */}
      <div className="flex items-center gap-2 text-xs text-green-600">
        <Radio className="h-3.5 w-3.5 animate-pulse" />
        <span>Live updates active — status changes appear instantly</span>
      </div>

      {apps.map((app) => (
        <div
          key={app.id}
          className={`transition-all duration-500 ${
            liveIds.has(app.id) ? "ring-2 ring-blue-400 ring-offset-1 rounded-xl" : ""
          }`}
        >
          {/* Collapse toggle header */}
          <button
            onClick={() => toggleExpand(app.id)}
            className="w-full flex items-center justify-between bg-white rounded-t-xl border border-b-0 border-gray-200 px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-900">{app.applicationNumber}</h3>
              <StatusBadge status={app.status} />
              {liveIds.has(app.id) && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  Updated
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/dashboard/applications/${app.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View Details <ArrowRight className="h-4 w-4" />
              </Link>
              {expandedIds.has(app.id) ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </button>

          {expandedIds.has(app.id) && (
            <div className="border border-t-0 border-gray-200 rounded-b-xl overflow-hidden">
              {/* Visual progress tracker */}
              <div className="overflow-x-auto">
                <ApplicationTracker
                  currentStatus={app.status}
                  applicationId={app.applicationNumber}
                  businessName={app.businessName}
                />
              </div>

              {/* Recent History */}
              {app.history.length > 0 && (
                <div className="px-6 pb-6">
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-400">
                    Recent Activity
                  </p>
                  <ul className="space-y-1">
                    {app.history.map((h) => (
                      <li key={h.id} className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span className="font-medium">{h.newStatus.replace(/_/g, " ")}</span>
                        <span>—</span>
                        <span>{formatDateTime(h.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
