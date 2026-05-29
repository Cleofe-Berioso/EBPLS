"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, X } from "lucide-react";
import { formatNotificationTime, getNotificationIcon } from "@/lib/mock-notifications";
import { useNotifications } from "@/hooks/use-notifications";
import type { Notification } from "@/types/notifications";

/**
 * Notification Dropdown Component
 * Displays recent notifications with mark as read functionality
 * Located in the Applicant Portal header
 */
export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { notifications, unreadCount, isLoading, error, markAsRead, markAllAsRead } =
    useNotifications();

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  /**
   * Close dropdown on Escape key
   */
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        <Bell className="h-4 w-4" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white"
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={dropdownRef}
          role="region"
          aria-label="Notifications panel"
          className="absolute -right-2 top-12 z-50 w-96 max-w-[calc(100vw-1rem)] rounded-2xl border border-slate-200 bg-white shadow-xl sm:w-96"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                title="Mark all as read"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center px-4 py-8">
                <p className="text-sm text-slate-500">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="px-4 py-8">
                <p className="text-sm text-red-600">Failed to load notifications</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-8">
                <Bell className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No notifications yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  You're all caught up! Check back soon.
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-200 px-4 py-3">
              <Link
                href="/applicant/notifications"
                onClick={() => setIsOpen(false)}
                className="inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                View all notifications →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Individual Notification Item in Dropdown
 */
function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) {
  const iconType = getNotificationIcon(notification.type);

  const getIconColor = (): string => {
    switch (iconType) {
      case "check":
        return "text-emerald-600";
      case "alert":
        return "text-amber-600";
      case "error":
        return "text-red-600";
      default:
        return "text-blue-600";
    }
  };

  const getBgColor = (): string => {
    if (notification.isRead) return "hover:bg-slate-50";
    return "bg-emerald-50/40 hover:bg-emerald-50/60";
  };

  const getLeftBorderColor = (): string => {
    if (notification.isRead) return "border-l-slate-200";
    return "border-l-emerald-500";
  };

  return (
    <div
      className={`flex items-start gap-3 border-l-3 px-3 py-2.5 rounded-lg transition-colors ${getBgColor()} ${getLeftBorderColor()}`}
    >
      {/* Icon */}
      <div className={`mt-0.5 flex-shrink-0 ${getIconColor()}`}>
        {iconType === "check" && <Bell className="h-4 w-4" />}
        {iconType === "alert" && <Bell className="h-4 w-4" />}
        {iconType === "error" && <X className="h-4 w-4" />}
        {iconType === "info" && <Bell className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900 line-clamp-1">
              {notification.title}
            </p>
            <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
              {notification.message}
            </p>
          </div>

          {/* Mark as read button */}
          {!notification.isRead && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="flex-shrink-0 ml-2 text-emerald-600 hover:text-emerald-700 transition-colors"
              title="Mark as read"
              aria-label={`Mark "${notification.title}" as read`}
            >
              <CheckCheck className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {formatNotificationTime(notification.timestamp)}
        </p>
      </div>
    </div>
  );
}
