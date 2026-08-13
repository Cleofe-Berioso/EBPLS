/**
 * Mock Notifications Provider
 * Generates realistic mock notification data for development and testing
 */

import type { Notification, NotificationType } from "@/types/notifications";

// Helper to generate a date relative to now
function getRelativeDate(minutesAgo: number): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.toISOString();
}

// Notification message templates by type
const NOTIFICATION_TEMPLATES: Record<
  NotificationType,
  {
    title: string;
    messageTemplate: (appNumber: string) => string;
  }
> = {
  APPLICATION_SUBMITTED: {
    title: "Application Submitted",
    messageTemplate: (appNumber: string) =>
      `Your application ${appNumber} has been successfully submitted for review.`,
  },
  RETURNED_FOR_CORRECTION: {
    title: "Returned for Correction",
    messageTemplate: (appNumber: string) =>
      `Application ${appNumber} has been returned. Please review the remarks and resubmit.`,
  },
  APPROVED_FOR_PAYMENT: {
    title: "Approved for Payment",
    messageTemplate: (appNumber: string) =>
      `Application ${appNumber} has been assessed. Proceed to payment verification.`,
  },
  REJECTED: {
    title: "Application Rejected",
    messageTemplate: (appNumber: string) =>
      `Unfortunately, application ${appNumber} has been rejected. Please contact BPLO for details.`,
  },
  ASSESSMENT_GENERATED: {
    title: "Assessment Generated",
    messageTemplate: (appNumber: string) =>
      `Fee assessment for application ${appNumber} is now available for review.`,
  },
  PAYMENT_VERIFIED: {
    title: "Payment Verified",
    messageTemplate: (appNumber: string) =>
      `Payment for application ${appNumber} has been verified successfully.`,
  },
  PERMIT_RELEASED: {
    title: "Permit Released",
    messageTemplate: (appNumber: string) =>
      `Your business permit for application ${appNumber} is now available for pickup.`,
  },
  CLOSURE_APPROVED: {
    title: "Closure Approved",
    messageTemplate: (appNumber: string) =>
      `Your closure application ${appNumber} has been approved. Certificate is ready.`,
  },
  INSPECTION_RELATED: {
    title: "Inspection Notice",
    messageTemplate: (appNumber: string) =>
      `An inspection has been scheduled for your business under application ${appNumber}.`,
  },
  REVOCATION_REVIEW: {
    title: "Permit Revocation Under Review",
    messageTemplate: (appNumber: string) =>
      `Application ${appNumber} is under permit revocation review. Review the basis and contact BPLO immediately.`,
  },
  REVOCATION_APPROVED: {
    title: "Business Permit Revoked",
    messageTemplate: (appNumber: string) =>
      `Your business permit for application ${appNumber} has been revoked. Contact BPLO for guidance.`,
  },
  REVOCATION_DENIED: {
    title: "Revocation Request Denied",
    messageTemplate: (appNumber: string) =>
      `The revocation request for application ${appNumber} was denied and your released permit status was restored.`,
  },
};

/**
 * Generate mock notifications for testing
 * Phase 1: Returns static data
 * Phase 2: Can integrate with real API
 */
export function generateMockNotifications(count: number = 8): Notification[] {
  const notifications: Notification[] = [];
  const types: NotificationType[] = [
    "APPLICATION_SUBMITTED",
    "RETURNED_FOR_CORRECTION",
    "APPROVED_FOR_PAYMENT",
    "PAYMENT_VERIFIED",
    "PERMIT_RELEASED",
    "ASSESSMENT_GENERATED",
    "REJECTED",
    "INSPECTION_RELATED",
    "REVOCATION_REVIEW",
    "REVOCATION_APPROVED",
    "REVOCATION_DENIED",
  ];

  const appNumbers = [
    "APP-2026-00001",
    "APP-2026-00002",
    "APP-2026-00003",
    "APP-2026-00004",
    "APP-2026-00005",
    "APP-2026-00006",
    "APP-2026-00007",
    "APP-2026-00008",
  ];

  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const template = NOTIFICATION_TEMPLATES[type];
    const appNumber = appNumbers[i % appNumbers.length];
    const minutesAgo = (i + 1) * 30; // Spread them out

    notifications.push({
      id: `notif-${i}`,
      title: template.title,
      message: template.messageTemplate(appNumber),
      type,
      timestamp: getRelativeDate(minutesAgo),
      isRead: i > 2, // First 3 are unread
      applicationId: `app-${i}`,
      applicationNumber: appNumber,
    });
  }

  return notifications;
}

/**
 * Get recent notifications (first N)
 * Used for dropdown display
 */
export function getRecentMockNotifications(limit: number = 5): Notification[] {
  const all = generateMockNotifications(10);
  return all.slice(0, limit);
}

/**
 * Filter notifications by read status
 */
export function filterNotifications(
  notifications: Notification[],
  isRead?: boolean
): Notification[] {
  if (isRead === undefined) return notifications;
  return notifications.filter((n) => n.isRead === isRead);
}

/**
 * Get unread count
 */
export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.isRead).length;
}

/**
 * Mark notification as read
 */
export function markNotificationAsRead(
  notification: Notification
): Notification {
  return {
    ...notification,
    isRead: true,
  };
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsAsRead(
  notifications: Notification[]
): Notification[] {
  return notifications.map((n) => ({ ...n, isRead: true }));
}

/**
 * Format relative time for display
 * Used in both dropdown and full page
 */
export function formatNotificationTime(isoTimestamp: string): string {
  const now = new Date();
  const notifDate = new Date(isoTimestamp);
  const diffMs = now.getTime() - notifDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  // Show date for older notifications
  return notifDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: notifDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Get notification icon based on type
 * Can be used to improve visual distinction
 */
export function getNotificationIcon(
  type: NotificationType
): "check" | "alert" | "info" | "error" {
  switch (type) {
    case "APPROVED_FOR_PAYMENT":
    case "PAYMENT_VERIFIED":
    case "PERMIT_RELEASED":
    case "CLOSURE_APPROVED":
      return "check";
    case "RETURNED_FOR_CORRECTION":
    case "INSPECTION_RELATED":
    case "REVOCATION_REVIEW":
      return "alert";
    case "REJECTED":
    case "REVOCATION_APPROVED":
      return "error";
    case "REVOCATION_DENIED":
      return "check";
    default:
      return "info";
  }
}
