/**
 * Notification Type Definitions
 * Core types for the Applicant Portal notification system
 */

export type NotificationType =
  | "APPLICATION_SUBMITTED"
  | "RETURNED_FOR_CORRECTION"
  | "APPROVED_FOR_PAYMENT"
  | "REJECTED"
  | "ASSESSMENT_GENERATED"
  | "PAYMENT_VERIFIED"
  | "PERMIT_RELEASED"
  | "CLOSURE_APPROVED"
  | "INSPECTION_RELATED"
  | "REVOCATION_REVIEW"
  | "REVOCATION_APPROVED"
  | "REVOCATION_DENIED";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string; // ISO 8601 datetime
  isRead: boolean;
  applicationId?: string;
  applicationNumber?: string;
}

export interface NotificationGroup {
  unread: Notification[];
  read: Notification[];
}

export interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoadingNotifications: boolean;
  error: string | null;
}

// Event type for notification creation (future backend)
export interface NotificationEvent {
  applicantId: string;
  type: NotificationType;
  title: string;
  message: string;
  applicationId?: string;
  applicationNumber?: string;
  metadata?: Record<string, unknown>;
}
