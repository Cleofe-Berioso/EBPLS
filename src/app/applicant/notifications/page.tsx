"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

interface ApplicantNotification {
  id: string;
  applicationNumber: string;
  toStatus: string;
  remarks: string | null;
  createdAt: string;
}

function formatRelativeTime(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} minute(s) ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour(s) ago`;
  const days = Math.floor(hours / 24);
  return `${days} day(s) ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<ApplicantNotification[]>([]);

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      const response = await fetch("/api/applicant/notifications", { cache: "no-store" });
      const data = (await response.json()) as { notifications?: ApplicantNotification[] };
      if (active && response.ok) setNotifications(data.notifications ?? []);
    }

    void loadNotifications();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Applicant"
        title="Notifications"
        description="Recent workflow updates, reminders, and recorded status changes for your applications."
      />
      <div className="space-y-3">
        {notifications.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
            <p className="text-sm font-semibold text-slate-900">
              {item.applicationNumber} moved to {item.toStatus}
            </p>
            <p className="mt-1 text-sm text-slate-600">{item.remarks || "No additional remarks."}</p>
            <p className="mt-2 text-xs text-slate-500">{formatRelativeTime(item.createdAt)}</p>
          </article>
        ))}
        {notifications.length === 0 ? (
          <EmptyState
            title="No records available yet"
            description="This section will populate as applications are processed. No action is required right now."
          />
        ) : null}
      </div>
    </section>
  );
}
