"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatNotificationTime } from "@/lib/mock-notifications";
import type { Notification } from "@/types/notifications";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      const response = await fetch("/api/applicant/notifications", { cache: "no-store" });
      const data = (await response.json()) as { notifications?: Notification[] };
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
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            <p className="mt-1 text-sm text-slate-600">{item.message}</p>
            {item.applicationNumber ? (
              <p className="mt-1 text-xs font-medium text-slate-500">{item.applicationNumber}</p>
            ) : null}
            <p className="mt-2 text-xs text-slate-500">{formatNotificationTime(item.timestamp)}</p>
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
