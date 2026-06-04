/**
 * RECOMMENDED PRISMA NOTIFICATION SCHEMA - Phase 2
 * 
 * This schema should be added to prisma/schema.prisma
 * when ready to move from Phase 1 (mock data) to Phase 2 (real database).
 * 
 * Add this to your schema.prisma file and run:
 * npx prisma migrate dev --name add_notification_system
 */

// Add this enum at the top level with other enums
enum NotificationType {
  APPLICATION_SUBMITTED
  RETURNED_FOR_CORRECTION
  APPROVED_FOR_PAYMENT
  REJECTED
  ASSESSMENT_GENERATED
  PAYMENT_VERIFIED
  PERMIT_RELEASED
  CLOSURE_APPROVED
  INSPECTION_RELATED
}

// Add this model after your other models
model Notification {
  // Core fields
  id                String             @id @default(cuid())
  applicantId       String
  type              NotificationType
  title             String
  message           String
  
  // Status tracking
  isRead            Boolean            @default(false)
  readAt            DateTime?
  
  // Application reference (optional - for linking to applications)
  applicationId     String?
  applicationNumber String?
  
  // Metadata for extensibility
  metadata          Json?              // Store additional data as JSON
  
  // Lifecycle timestamps
  createdAt         DateTime           @default(now())
  expiresAt         DateTime?          // Optional: auto-delete old notifications
  
  // Relations
  applicant         User               @relation("NotificationRecipient", fields: [applicantId], references: [id], onDelete: Cascade)
  
  // Indexes for common queries
  @@index([applicantId, createdAt])
  @@index([applicantId, isRead])
  @@index([createdAt])
  @@index([expiresAt])  // For cleanup jobs
}

// Add to User model:
// notifications      Notification[]     @relation("NotificationRecipient")

/**
 * MIGRATION INSTRUCTIONS
 * 
 * Step 1: Copy enum NotificationType above your existing enums
 * 
 * Step 2: Copy model Notification after your other models
 * 
 * Step 3: Add this line to the User model (in the relations section):
 *   notifications    Notification[]     @relation("NotificationRecipient")
 * 
 * Step 4: Run migration:
 *   npx prisma migrate dev --name add_notification_system
 * 
 * Step 5: Regenerate Prisma client:
 *   npx prisma generate
 * 
 * Step 6: Update API routes and hooks to use the database
 */

/**
 * IMPLEMENTATION CHECKLIST FOR PHASE 2
 * 
 * Frontend Changes:
 * [ ] Update /src/hooks/use-notifications.ts to call real API
 * [ ] Keep mock-notifications.ts as development fallback
 * [ ] Add feature flag to toggle mock vs real data
 * 
 * Backend Changes:
 * [ ] Create API endpoint to create notifications
 * [ ] Update GET /api/applicant/notifications to query database
 * [ ] Implement PATCH /api/applicant/notifications/:id to mark as read
 * [ ] Implement PATCH /api/applicant/notifications/mark-all-as-read
 * [ ] Create job to delete expired notifications (expiresAt)
 * [ ] Add database indexes for performance
 * 
 * Event Creation:
 * [ ] Create notification when application is submitted
 * [ ] Create notification when returned for correction
 * [ ] Create notification when approved for payment
 * [ ] Create notification when payment verified
 * [ ] Create notification when permit released
 * [ ] Create notification when application rejected
 * [ ] Create notification for inspection-related events
 * [ ] Create notification for closure approval
 * 
 * Testing:
 * [ ] Unit tests for notification creation
 * [ ] Integration tests for API endpoints
 * [ ] E2E tests for dropdown functionality
 * [ ] Load testing for notification queries
 * 
 * Monitoring:
 * [ ] Track notification creation rates
 * [ ] Monitor database size/retention
 * [ ] Alert on failed notification delivery
 * [ ] Track user notification preferences
 */

/**
 * SAMPLE DATABASE QUERIES
 * 
 * // Get recent notifications for user
 * const notifications = await prisma.notification.findMany({
 *   where: { applicantId: userId },
 *   orderBy: { createdAt: 'desc' },
 *   take: 5,
 * });
 * 
 * // Get unread count
 * const unreadCount = await prisma.notification.count({
 *   where: { 
 *     applicantId: userId,
 *     isRead: false,
 *   },
 * });
 * 
 * // Mark as read
 * await prisma.notification.update({
 *   where: { id: notificationId },
 *   data: { 
 *     isRead: true,
 *     readAt: new Date(),
 *   },
 * });
 * 
 * // Mark all as read
 * await prisma.notification.updateMany({
 *   where: { 
 *     applicantId: userId,
 *     isRead: false,
 *   },
 *   data: { 
 *     isRead: true,
 *     readAt: new Date(),
 *   },
 * });
 * 
 * // Delete old notifications
 * await prisma.notification.deleteMany({
 *   where: {
 *     expiresAt: { lt: new Date() },
 *   },
 * });
 * 
 * // Create notification
 * await prisma.notification.create({
 *   data: {
 *     applicantId: userId,
 *     type: 'APPLICATION_SUBMITTED',
 *     title: 'Application Submitted',
 *     message: 'Your application APP-2026-00001 has been submitted.',
 *     applicationId: appId,
 *     applicationNumber: 'APP-2026-00001',
 *     expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
 *   },
 * });
 */

/**
 * API ENDPOINT PATTERNS FOR PHASE 2
 * 
 * GET /api/applicant/notifications
 * - Query params: limit=5, skip=0, unreadOnly=false
 * - Returns: { notifications: Notification[], unreadCount: number }
 * 
 * PATCH /api/applicant/notifications/:id
 * - Body: { isRead: true }
 * - Returns: { success: true, notification: Notification }
 * 
 * PATCH /api/applicant/notifications/mark-all-as-read
 * - Returns: { success: true, updatedCount: number }
 * 
 * DELETE /api/applicant/notifications/:id
 * - Returns: { success: true }
 * 
 * DELETE /api/applicant/notifications
 * - Deletes all for current user
 * - Returns: { success: true, deletedCount: number }
 */

/**
 * ENVIRONMENT SETUP FOR PHASE 2
 * 
 * In your .env.local:
 * 
 * # Notification settings
 * NOTIFICATION_RETENTION_DAYS=90
 * NOTIFICATION_BATCH_SIZE=100
 * NOTIFICATIONS_ENABLED=true
 * 
 * # For real-time notifications (Phase 3)
 * WEBSOCKET_ENABLED=false
 * NOTIFICATION_WEBHOOK_URL=
 */
