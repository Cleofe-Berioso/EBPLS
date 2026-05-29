# Applicant Portal Notification System - Phase 1 Implementation Guide

## Overview

This document outlines the complete Phase 1 implementation of the Applicant Portal notification system, including frontend components, mock data system, and preparation for Phase 2 backend integration.

## What Was Implemented

### 1. **Type Definitions** (`src/types/notifications.ts`)
- Core notification types and interfaces
- `NotificationType` enum for 9 event types
- `Notification` interface with full structure
- `NotificationEvent` interface for future backend events
- `NotificationsState` interface for state management

**Event Types Supported:**
- `APPLICATION_SUBMITTED` - When applicant submits an application
- `RETURNED_FOR_CORRECTION` - When BPLO returns application for revision
- `APPROVED_FOR_PAYMENT` - When application passes assessment
- `REJECTED` - When application is rejected
- `ASSESSMENT_GENERATED` - When fee assessment is ready
- `PAYMENT_VERIFIED` - When payment is verified by BPLO
- `PERMIT_RELEASED` - When permit is ready for pickup
- `CLOSURE_APPROVED` - When closure certificate is approved
- `INSPECTION_RELATED` - For inspection-related updates

### 2. **Mock Notifications System** (`src/lib/mock-notifications.ts`)
- Generates realistic test data matching real notification structure
- Helper functions for common operations:
  - `generateMockNotifications(count)` - Create N notifications
  - `getRecentMockNotifications(limit)` - Get top N for dropdown
  - `filterNotifications(notifications, isRead)` - Filter by read status
  - `getUnreadCount(notifications)` - Count unread items
  - `markNotificationAsRead(notification)` - Mark single as read
  - `markAllNotificationsAsRead(notifications)` - Batch mark as read
  - `formatNotificationTime(isoTimestamp)` - Human-readable times
  - `getNotificationIcon(type)` - Determine message icon

**Features:**
- Timestamps spread across past 240 minutes
- Mixed read/unread states
- Associated application numbers
- Template-based messages for each notification type

### 3. **Custom React Hook** (`src/hooks/use-notifications.ts`)
Provides complete notification state management:

**Returns:**
```typescript
{
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  refetch: () => Promise<void>;
}
```

**Features:**
- Auto-fetch on component mount
- Auto-refresh every 30 seconds (configurable)
- Prevents state updates on unmounted components
- Error handling and loading states
- Easy swap from mock to real API

### 4. **Notification Dropdown Component** (`src/components/applicant/notification-dropdown.tsx`)
Interactive dropdown in Applicant Portal header

**Features:**
- Click bell icon to open/close
- Click outside to close
- Escape key to close
- Unread badge with count (shows "9+" for 9+)
- List of recent 5 notifications
- Mark single notification as read
- Mark all as read button
- View all link to full notifications page
- Empty state when no notifications
- Loading state during fetch
- Error state with retry message
- Responsive design (fits mobile/tablet/desktop)
- Full keyboard accessibility
- ARIA labels and roles

**Components:**
- `NotificationDropdown` - Main container with bell icon
- `NotificationItem` - Individual notification card

**Styling:**
- Matches EBPLS green theme (#0b8754)
- Uses Tailwind CSS with responsive design
- Emerald accent colors for unread items
- Icon-based severity indication
- Rounded borders and smooth transitions

### 5. **Header Integration** (Modified `src/components/applicant/applicant-layout-client.tsx`)
- Replaced static Bell icon with `<NotificationDropdown />`
- Removed unused `Bell` icon import
- Added `NotificationDropdown` import
- Maintained existing header layout and styling

## Current State (Phase 1)

### What Works Now
✅ Bell icon opens/closes notification dropdown  
✅ Unread notification badge displays count  
✅ Recent 5 notifications show in dropdown  
✅ Mark single notification as read  
✅ Mark all as read functionality  
✅ View all notifications link  
✅ Empty state shown when no notifications  
✅ Loading and error states  
✅ Click outside closes dropdown  
✅ Escape key closes dropdown  
✅ Fully keyboard accessible  
✅ Mobile responsive dropdown  
✅ Mock data system ready for testing  

### What's Using Mock Data
- Notification list in dropdown
- Unread count
- Mock timestamps (relative time ago)
- Mock notification types and messages

### What Remains Connected to Real Backend
- Full notifications page (`src/app/applicant/notifications/page.tsx`)
- Notification API route (`src/app/api/applicant/notifications/route.ts`)

## File Structure

```
src/
├── types/
│   └── notifications.ts          # New - Type definitions
├── lib/
│   └── mock-notifications.ts     # New - Mock data provider
├── hooks/
│   └── use-notifications.ts      # New - Custom hook
├── components/
│   └── applicant/
│       ├── notification-dropdown.tsx  # New - Main component
│       └── applicant-layout-client.tsx # Modified - Integrated dropdown
└── app/
    └── applicant/
        └── notifications/
            └── page.tsx          # Existing - Full page (unchanged)
```

## Usage Example

### In a Component
```typescript
import { NotificationDropdown } from "@/components/applicant/notification-dropdown";

export function MyComponent() {
  return (
    <div>
      <NotificationDropdown />
    </div>
  );
}
```

### Direct Hook Usage
```typescript
import { useNotifications } from "@/hooks/use-notifications";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = 
    useNotifications();

  return (
    <div>
      <span>{unreadCount} unread</span>
      {notifications.map(n => (
        <button key={n.id} onClick={() => markAsRead(n.id)}>
          {n.title}
        </button>
      ))}
    </div>
  );
}
```

## Phase 2: Backend Integration (Recommended)

### Prisma Schema Addition

```prisma
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

model Notification {
  id                String             @id @default(cuid())
  applicantId       String
  type              NotificationType
  title             String
  message           String
  isRead            Boolean            @default(false)
  applicationId     String?
  applicationNumber String?
  metadata          Json?              // For storing extra data
  createdAt         DateTime           @default(now())
  readAt            DateTime?
  expiresAt         DateTime?          // Auto-delete old notifications
  
  applicant         User               @relation(fields: [applicantId], references: [id], onDelete: Cascade)
  
  @@index([applicantId, createdAt])
  @@index([applicantId, isRead])
  @@index([createdAt])
}
```

### Migration Steps
```bash
# 1. Add schema
# Edit prisma/schema.prisma and add the Notification model

# 2. Create migration
npx prisma migrate dev --name add_notifications

# 3. Generate types
npx prisma generate

# 4. Update API route
# Modify /src/app/api/applicant/notifications/route.ts to use database

# 5. Update hook
# Modify /src/hooks/use-notifications.ts to call real API instead of mock
```

### Backend API Changes

**Current Mock (Phase 1):**
```typescript
const mockData = getRecentMockNotifications(5);
setNotifications(mockData);
```

**Future Real API (Phase 2):**
```typescript
const response = await fetch("/api/applicant/notifications", {
  cache: "no-store",
});
const data = await response.json();
setNotifications(data.notifications);
```

### Creating Notifications from BPLO Actions

Example: When BPLO approves an application for payment

```typescript
// In BPLO approval endpoint
async function approveApplicationForPayment(applicationId: string, bploUserId: string) {
  // ... existing approval logic ...
  
  // Create notification for applicant
  await prisma.notification.create({
    data: {
      applicantId: app.applicantId,
      type: "APPROVED_FOR_PAYMENT",
      title: "Approved for Payment",
      message: `Application ${app.applicationNumber} has been assessed and approved for payment.`,
      applicationId: app.id,
      applicationNumber: app.applicationNumber,
    },
  });
}
```

### Real-time Updates (Phase 3)

Consider adding:
- WebSocket connection for live updates
- Server-Sent Events (SSE) for push notifications
- Polling interval optimization based on user behavior
- SMS notifications for critical updates
- Email digest of unread notifications

## Testing

### Manual Testing

1. **Show Notification Badge**
   - Bell icon should show badge with unread count
   - Badge disappears when count is 0

2. **Open/Close Dropdown**
   - Click bell icon to open
   - Click outside to close
   - Press Escape to close
   - Click bell again to toggle

3. **Mark as Read**
   - Click checkmark on unread notification
   - Background changes to normal
   - Count decreases
   - Button disappears

4. **Mark All as Read**
   - Click "Mark all as read"
   - All notifications become read
   - Badge disappears
   - Button disappears

5. **View All Navigation**
   - Click "View all notifications →"
   - Navigate to /applicant/notifications
   - Dropdown closes

6. **Mobile Responsiveness**
   - Dropdown fits screen width
   - Touch-friendly buttons
   - Proper scrolling on small screens

### Mock Data Testing

Test with different notification types by modifying:
```typescript
// In src/lib/mock-notifications.ts
const types: NotificationType[] = [
  // Add/remove types to test different combinations
];
```

## Performance Notes

- **Refresh Interval**: 30 seconds (configurable in hook)
- **Dropdown Limit**: 5 items (hardcoded, can be made configurable)
- **Auto-cleanup**: None (would need backend implementation)
- **Memory**: Minimal - stores only recent notifications

## Accessibility Features

✅ Keyboard navigation (Tab, Enter, Escape)  
✅ ARIA labels and roles  
✅ Focus management  
✅ Color not only indicator (icons + text)  
✅ Loading state announcements  
✅ Error messages readable  

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile Safari: ✅ Full support
- Mobile Chrome: ✅ Full support

## Known Limitations (Phase 1)

1. ⚠️ Uses mock data (not real notifications)
2. ⚠️ No persistence (data lost on page refresh)
3. ⚠️ No sorting/filtering options
4. ⚠️ No notification categories/tags
5. ⚠️ No notification preferences
6. ⚠️ No bulk actions (except mark all as read)

## Future Enhancements

- [ ] Notification preferences/settings
- [ ] Advanced filtering (by type, date range)
- [ ] Search notifications
- [ ] Notification categories/grouping
- [ ] Archive/delete notifications
- [ ] Email notification delivery
- [ ] SMS notification delivery
- [ ] Push notifications (PWA/native)
- [ ] Real-time updates via WebSocket
- [ ] Notification history/pagination
- [ ] Read receipts with timestamps
- [ ] User-specific notification templates
- [ ] Notification expiry/auto-cleanup

## Support for Other Roles (Future)

The notification system can be extended for:
- **BPLO**: Application review alerts, payment verification reminders
- **Department Head**: Compliance review requests, inspection results
- **JIT**: Inspection assignments, compliance updates
- **Superadmin**: System alerts, audit events

## Conclusion

Phase 1 provides a complete, functional notification dropdown UI with mock data. The system is designed to be easily upgraded to real backend integration in Phase 2 with minimal code changes. All interfaces, types, and helper functions are in place for future backend development.
