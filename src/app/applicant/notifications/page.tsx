"use client";

import { useCallback, useEffect, useState } from "react";
import { applicantListCardClass } from "@/components/applicant/applicant-ui-styles";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { formatNotificationTime } from "@/lib/mock-notifications";
import type { PaginationPageSize } from "@/lib/pagination";
import type { Notification } from "@/types/notifications";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PaginationPageSize>(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async (nextPage: number, nextPageSize: PaginationPageSize) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(nextPage),
      pageSize: String(nextPageSize),
    });

    const response = await fetch(`/api/applicant/notifications?${params.toString()}`, { cache: "no-store" });
    const data = (await response.json()) as {
      records?: Notification[];
      totalCount?: number;
      page?: number;
      pageSize?: PaginationPageSize;
      totalPages?: number;
    };

    if (response.ok) {
      setNotifications(data.records ?? []);
      setTotalCount(data.totalCount ?? 0);
      setPage(data.page ?? nextPage);
      setPageSize(data.pageSize ?? nextPageSize);
      setTotalPages(data.totalPages ?? 1);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadNotifications(page, pageSize);
  }, [loadNotifications, page, pageSize]);

  return (
    <section className="ui-page-stack">
      <PageHeader
        eyebrow="Applicant"
        title="Notifications"
        description="Recent workflow updates, reminders, and recorded status changes for your applications."
      />

      {loading && notifications.length === 0 ? (
        <LoadingState message="Loading notifications…" compact />
      ) : (
        <div className={`space-y-2.5 ${loading ? "opacity-60" : ""}`}>
          {notifications.map((item) => (
            <article key={item.id} className={applicantListCardClass}>
              <p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--ink-muted)]">{item.message}</p>
              {item.applicationNumber ? (
                <p className="mt-1 font-mono text-xs text-[var(--ink-muted)]">{item.applicationNumber}</p>
              ) : null}
              <p className="mt-2 ui-caption">{formatNotificationTime(item.timestamp)}</p>
            </article>
          ))}
          {notifications.length === 0 && !loading ? (
            <EmptyState
              title="No records available yet"
              description="This section will populate as applications are processed. No action is required right now."
            />
          ) : null}
        </div>
      )}

      <PaginationControls
        basePath="/applicant/notifications"
        queryParams={{}}
        mode="client"
        isLoading={loading}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        recordLabel="notifications"
        sortHint="Newest notifications appear first."
        onPageChange={setPage}
        onPageSizeChange={(nextSize) => {
          setPageSize(nextSize);
          setPage(1);
        }}
      />
    </section>
  );
}
