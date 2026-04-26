"use client";

import { useState, useEffect } from "react";
import { Bell, X, CheckCheck, Info, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSSE } from "@/hooks/use-sse";
import type { SSEEvent } from "@/lib/sse";

interface AppNotification {
  id: string;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: Date;
  type: "info" | "success" | "warning";
}

function NotifIcon({ type }: { type: AppNotification["type"] }) {
  if (type === "success") return <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />;
  if (type === "warning") return <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />;
  return <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />;
}

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const unread = notifications.filter((n) => !n.read).length;

  // Listen to SSE notification events
  useSSE({
    notification: (event: SSEEvent) => {
      const { title, message, actionUrl } = event.data as {
        title: string;
        message: string;
        actionUrl?: string;
      };
      setNotifications((prev) => [
        {
          id: Math.random().toString(36).slice(2),
          title,
          message,
          actionUrl,
          read: false,
          createdAt: new Date(),
          type: "info",
        },
        ...prev.slice(0, 49), // keep max 50
      ]);
    },
    application_status_changed: (event: SSEEvent) => {
      const { applicationNumber, newStatus } = event.data as {
        applicationNumber: string;
        newStatus: string;
      };
      setNotifications((prev) => [
        {
          id: Math.random().toString(36).slice(2),
          title: "Application Status Updated",
          message: `Application ${applicationNumber} is now ${newStatus.replace("_", " ").toLowerCase()}.`,
          actionUrl: "/dashboard/tracking",
          read: false,
          createdAt: new Date(),
          type: ["PAID", "PERMIT_PREPARED", "READY_FOR_RELEASE", "RELEASED", "COMPLETED"].includes(newStatus) ? "success" : newStatus === "REJECTED" ? "warning" : "info",
        },
        ...prev.slice(0, 49),
      ]);
    },
    permit_issued: (event: SSEEvent) => {
      const { permitNumber } = event.data as { permitNumber?: string };
      setNotifications((prev) => [
        {
          id: Math.random().toString(36).slice(2),
          title: "Permit Ready",
          message: permitNumber
            ? `Permit #${permitNumber} is ready for claiming.`
            : "Your permit is ready for claiming.",
          actionUrl: "/dashboard/claim-reference",
          read: false,
          createdAt: new Date(),
          type: "success",
        },
        ...prev.slice(0, 49),
      ]);
    },
  });

  function markAllRead() {
    setNotifications((n) => n.map((notif) => ({ ...notif, read: true })));
  }

  function dismiss(id: string) {
    setNotifications((n) => n.filter((notif) => notif.id !== id));
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-notification-bell]")) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" data-notification-bell>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 hover:bg-gray-100"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>      {open && (
        <div className="fixed right-2 left-2 sm:left-auto sm:absolute sm:right-0 z-50 mt-2 sm:w-96 rounded-xl border bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications {unread > 0 && <span className="ml-1 rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-600">{unread}</span>}
            </h3>
            {unread > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "group flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors",
                    !notif.read && "bg-blue-50/50"
                  )}
                >
                  <NotifIcon type={notif.type} />
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm font-medium text-gray-900", !notif.read && "font-semibold")}>
                      {notif.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">{notif.message}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-gray-400">{timeAgo(notif.createdAt)}</span>
                      {notif.actionUrl && (
                        <a href={notif.actionUrl} className="text-xs text-blue-600 hover:underline" onClick={() => setOpen(false)}>
                          View →
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => dismiss(notif.id)}
                    className="ml-1 rounded p-0.5 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t px-4 py-2">
              <button
                onClick={() => setNotifications([])}
                className="text-xs text-gray-500 hover:text-red-500"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
