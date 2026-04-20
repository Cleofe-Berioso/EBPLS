/**
 * Server-Sent Events (SSE) for Real-Time Updates
 * Live application status updates and slot availability
 */

// ============================================================================
// SSE Event Types
// ============================================================================

export type SSEEventType =
  | 'application_status_changed'
  | 'application_approved'
  | 'application_rejected'
  | 'revision_requested'
  | 'document_verified'
  | 'document_uploaded'
  | 'document_rejected'
  | 'clearance_initiated'
  | 'clearance_updated'
  | 'permit_issued'
  | 'permit_printed'
  | 'permit_expired'
  | 'payment_initiated'
  | 'notification'
  | 'heartbeat';

export interface SSEEvent {
  type: SSEEventType;
  data: Record<string, unknown>;
  userId?: string;
  timestamp: string;
}

// ============================================================================
// In-Memory Client Registry (production should use Redis Pub/Sub)
// ============================================================================

type ClientCallback = (event: SSEEvent) => void;

class SSEBroadcaster {
  private clients: Map<string, Set<ClientCallback>> = new Map();

  /**
   * Register a client for a specific user
   */
  subscribe(userId: string, callback: ClientCallback): () => void {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const userClients = this.clients.get(userId);
      if (userClients) {
        userClients.delete(callback);
        if (userClients.size === 0) {
          this.clients.delete(userId);
        }
      }
    };
  }

  /**
   * Send event to a specific user
   */
  sendToUser(userId: string, event: SSEEvent): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.forEach((callback) => callback(event));
    }
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcast(event: SSEEvent): void {
    this.clients.forEach((callbacks) => {
      callbacks.forEach((callback) => callback(event));
    });
  }

  /**
   * Get connected client count
   */
  getClientCount(): number {
    let count = 0;
    this.clients.forEach((callbacks) => {
      count += callbacks.size;
    });
    return count;
  }
}

// Singleton broadcaster
export const sseBroadcaster = new SSEBroadcaster();

// ============================================================================
// Helper: Create SSE Event
// ============================================================================

export function createSSEEvent(
  type: SSEEventType,
  data: Record<string, unknown>,
  userId?: string
): SSEEvent {
  return {
    type,
    data,
    userId,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Helper: Format SSE Message
// ============================================================================

export function formatSSEMessage(event: SSEEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

// ============================================================================
// High-Level Broadcast Functions
// ============================================================================

export function broadcastApplicationStatusChange(
  userId: string,
  applicationId: string,
  applicationNumber: string,
  newStatus: string,
  previousStatus?: string
): void {
  sseBroadcaster.sendToUser(
    userId,
    createSSEEvent('application_status_changed', {
      applicationId,
      applicationNumber,
      newStatus,
      previousStatus,
    }, userId)
  );
}

export function broadcastDocumentVerified(
  userId: string,
  documentId: string,
  documentName: string,
  status: string
): void {
  sseBroadcaster.sendToUser(
    userId,
    createSSEEvent('document_verified', {
      documentId,
      documentName,
      status,
    }, userId)
  );
}

export function broadcastNotification(
  userId: string,
  title: string,
  message: string,
  actionUrl?: string
): void {
  sseBroadcaster.sendToUser(
    userId,
    createSSEEvent('notification', {
      title,
      message,
      actionUrl,
    }, userId)
  );
}

// ============================================================================
// P2.3: Document Upload & Verification Events
// ============================================================================

export function broadcastDocumentUploaded(
  userId: string,
  documentId: string,
  documentType: string,
  documentName: string,
  applicationId: string
): void {
  sseBroadcaster.sendToUser(
    userId,
    createSSEEvent('document_uploaded', {
      documentId,
      documentType,
      documentName,
      applicationId,
      status: 'UPLOADED',
    }, userId)
  );
}

export function broadcastDocumentRejected(
  userId: string,
  documentId: string,
  documentType: string,
  rejectionReason: string,
  applicationId: string
): void {
  sseBroadcaster.sendToUser(
    userId,
    createSSEEvent('document_rejected', {
      documentId,
      documentType,
      rejectionReason,
      applicationId,
      status: 'REJECTED',
    }, userId)
  );
}

// ============================================================================
// P2.4: Application Review & Approval Events
// ============================================================================

export function broadcastApplicationApproved(
  userId: string,
  applicationId: string,
  applicationNumber: string,
  permitNumber?: string,
  comment?: string
): void {
  sseBroadcaster.sendToUser(
    userId,
    createSSEEvent('application_approved', {
      applicationId,
      applicationNumber,
      permitNumber,
      comment,
      status: 'APPROVED',
    }, userId)
  );
}

export function broadcastApplicationRejected(
  userId: string,
  applicationId: string,
  applicationNumber: string,
  rejectionReason: string,
  comment?: string
): void {
  sseBroadcaster.sendToUser(
    userId,
    createSSEEvent('application_rejected', {
      applicationId,
      applicationNumber,
      rejectionReason,
      comment,
      status: 'REJECTED',
    }, userId)
  );
}

export function broadcastRevisionRequested(
  userId: string,
  applicationId: string,
  applicationNumber: string,
  comment: string,
  requiredChanges?: string[]
): void {
  sseBroadcaster.sendToUser(
    userId,
    createSSEEvent('revision_requested', {
      applicationId,
      applicationNumber,
      comment,
      requiredChanges,
      status: 'REVISION_REQUESTED',
    }, userId)
  );
}

// ============================================================================
// P3.0: Clearance & Endorsement Events
// ============================================================================

export function broadcastClearanceInitiated(
  userId: string,
  applicationId: string,
  applicationNumber: string,
  offices: string[]
): void {
  sseBroadcaster.sendToUser(
    userId,
    createSSEEvent('clearance_initiated', {
      applicationId,
      applicationNumber,
      offices,
      officeCount: offices.length,
      status: 'CLEARANCE_INITIATED',
      timestamp: new Date().toISOString(),
    }, userId)
  );
}

export function broadcastClearanceUpdated(
  userId: string,
  applicationId: string,
  officeCode: string,
  officeName: string,
  status: string
): void {
  sseBroadcaster.sendToUser(
    userId,
    createSSEEvent('clearance_updated', {
      applicationId,
      officeCode,
      officeName,
      status,
      timestamp: new Date().toISOString(),
    }, userId)
  );
}

// ============================================================================
// Payment Events
// ============================================================================

export function broadcastPaymentInitiated(
  userId: string,
  applicationId: string,
  details: {
    referenceNumber: string;
    amount: number;
    method: string;
  }
): void {
  sseBroadcaster.sendToUser(
    userId,
    createSSEEvent('notification', {
      applicationId,
      referenceNumber: details.referenceNumber,
      amount: details.amount,
      method: details.method,
      message: `Payment initiated - Reference: ${details.referenceNumber}`,
      timestamp: new Date().toISOString(),
    }, userId)
  );
}

// ============================================================================
// Permit Issuance Events
// ============================================================================

export function broadcastPermitIssued(
  userId: string,
  permitId: string,
  permitNumber: string
): void {
  sseBroadcaster.sendToUser(
    userId,
    createSSEEvent('permit_issued', {
      permitId,
      permitNumber,
      message: `Permit issued: ${permitNumber}`,
      timestamp: new Date().toISOString(),
    }, userId)
  );
}

// ============================================================================
// Phase 5: Permit Issuance Events
// ============================================================================

export function broadcastPermitPrinted(
  userId: string,
  permitNumber: string
): void {
  sseBroadcaster.sendToUser(
    userId,
    createSSEEvent('permit_printed', {
      permitNumber,
      message: `Permit ${permitNumber} has been printed`,
      timestamp: new Date().toISOString(),
    }, userId)
  );
}

export function broadcastPermitExpired(
  userId: string,
  permitNumber: string,
  businessName: string
): void {
  sseBroadcaster.sendToUser(
    userId,
    createSSEEvent('permit_expired', {
      permitNumber,
      businessName,
      message: `Permit ${permitNumber} (${businessName}) has expired`,
      timestamp: new Date().toISOString(),
    }, userId)
  );
}
