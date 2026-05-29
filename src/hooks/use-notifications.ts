"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import type { Notification } from "@/types/notifications";
import {
  getRecentMockNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/mock-notifications";

/**
 * Custom hook for managing notification state and interactions
 * Provides:
 * - Loading and fetching notifications
 * - Mark as read functionality
 * - Unread count tracking
 * - Error handling
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if component is mounted to avoid state updates on unmounted components
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Fetch notifications from API or mock data
   * Phase 1: Uses mock data
   * Phase 2: Will use real API
   */
  const fetchNotifications = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // Phase 1: Mock data
      const mockData = getRecentMockNotifications(5);

      if (isMountedRef.current) {
        setNotifications(mockData);
        setUnreadCount(getUnreadCount(mockData));
      }

      // Future: Replace with real API call
      // const response = await fetch("/api/applicant/notifications", {
      //   cache: "no-store",
      // });
      // const data = await response.json();
      // if (isMountedRef.current && response.ok) {
      //   setNotifications(data.notifications ?? []);
      //   setUnreadCount(getUnreadCount(data.notifications ?? []));
      // }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to load notifications");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Mark a single notification as read
   */
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === notificationId ? markNotificationAsRead(n) : n
      );
      setUnreadCount(getUnreadCount(updated));
      return updated;
    });
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = markAllNotificationsAsRead(prev);
      setUnreadCount(0);
      return updated;
    });
  }, []);

  /**
   * Clear all notifications (optional feature)
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  // Auto-refresh every 30 seconds (can be made configurable)
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    clearAll,
    refetch: fetchNotifications,
  };
}
