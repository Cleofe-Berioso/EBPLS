/**
 * RBAC Permission System using CASL.js
 * Fine-grained permission control for all entities
 * 3 Roles: APPLICANT, BPLO_OFFICE, MTO
 */

import { AbilityBuilder, PureAbility } from '@casl/ability';

// ============================================================================
// Action & Subject Definitions
// ============================================================================

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'review' | 'approve' | 'verify' | 'issue' | 'confirm' | 'export';

export type Subjects =
  | 'Application'
  | 'Document'
  | 'User'
  | 'Permit'
  | 'Payment'
  | 'Report'
  | 'SystemSetting'
  | 'ActivityLog'
  | 'BusinessLocation'
  | 'all';

export type AppAbility = PureAbility<[Actions, Subjects]>;

// ============================================================================
// Role-based Ability Definitions
// ============================================================================

export type Role = 'APPLICANT' | 'BPLO_OFFICE' | 'MTO';

export function defineAbilitiesFor(role: Role, _userId?: string): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(PureAbility);

  switch (role) {
    case 'BPLO_OFFICE':
      // BPLO handles application processing, document verification, review, approval/revision, permit issuance
      can('manage', 'Application');
      can('read', 'Document');
      can('verify', 'Document'); // Verify document completeness and authenticity
      can('read', 'User'); // View applicant details for applications
      can('read', 'Permit');
      can('issue', 'Permit'); // Issue permits (after MTO payment confirmation)
      can('read', 'Payment'); // Reference only, cannot modify
      can('read', 'Report');
      can('export', 'Report');
      can('manage', 'BusinessLocation'); // Add, edit, delete location master data
      can('read', 'ActivityLog');
      cannot('update', 'Payment'); // Cannot modify payments
      cannot('confirm', 'Payment'); // Cannot confirm payments (MTO only)
      cannot('manage', 'SystemSetting');
      break;

    case 'MTO':
      // MTO handles payment validation ONLY
      can('read', 'Payment');
      can('update', 'Payment'); // Validate payments
      can('confirm', 'Payment'); // Confirm payment status to BPLO
      can('create', 'Payment'); // Record payment receipts
      can('read', 'Report'); // Payment and revenue reports only
      can('export', 'Report');
      can('read', 'ActivityLog'); // Own payment actions only
      // Strictly cannot do anything else
      cannot('read', 'Application'); // Cannot view application details
      cannot('read', 'Document'); // Cannot access submitted documents
      cannot('review', 'Application');
      cannot('approve', 'Application');
      cannot('verify', 'Document');
      cannot('issue', 'Permit');
      cannot('manage', 'User');
      cannot('manage', 'BusinessLocation');
      cannot('manage', 'SystemSetting');
      break;

    case 'APPLICANT':
      // Applicants can manage their own applications, access renewal (if eligible), and make payments
      can('create', 'Application'); // Submit new and renewal applications
      can('read', 'Application'); // Own applications only (filtered at query level)
      can('update', 'Application'); // Own draft applications (status DRAFT only)
      can('delete', 'Application'); // Own draft applications
      can('create', 'Document'); // Upload documents
      can('read', 'Document'); // Own documents only
      can('read', 'Permit'); // Own permits only
      can('create', 'Payment'); // Make payments
      can('read', 'Payment'); // Own payments only
      // Strictly cannot do anything else
      cannot('verify', 'Document');
      cannot('review', 'Application');
      cannot('approve', 'Application');
      cannot('issue', 'Permit');
      cannot('confirm', 'Payment');
      cannot('manage', 'User');
      cannot('manage', 'BusinessLocation');
      cannot('manage', 'SystemSetting');
      cannot('manage', 'Report');
      break;

    default:
      // No permissions for unknown roles
      break;
  }

  return build();
}

// ============================================================================
// Permission Checking Helpers
// ============================================================================

export function canPerformAction(role: Role, action: Actions, subject: Subjects): boolean {
  const ability = defineAbilitiesFor(role);
  return ability.can(action, subject);
}

export function getPermittedActions(role: Role, subject: Subjects): Actions[] {
  const allActions: Actions[] = ['create', 'read', 'update', 'delete', 'manage', 'review', 'approve', 'verify', 'issue', 'confirm', 'export'];
  const ability = defineAbilitiesFor(role);
  return allActions.filter((action) => ability.can(action, subject));
}

// ============================================================================
// Navigation Permissions (for sidebar filtering)
// ============================================================================

export interface NavPermission {
  path: string;
  label: string;
  requiredAbility: { action: Actions; subject: Subjects };
  roles: Role[];
}

export const navigationPermissions: NavPermission[] = [
  // Applicant Routes
  { path: '/dashboard', label: 'Dashboard', requiredAbility: { action: 'read', subject: 'Application' }, roles: ['APPLICANT'] },
  { path: '/dashboard/applications', label: 'My Applications', requiredAbility: { action: 'read', subject: 'Application' }, roles: ['APPLICANT'] },
  { path: '/dashboard/documents', label: 'My Documents', requiredAbility: { action: 'read', subject: 'Document' }, roles: ['APPLICANT'] },
  { path: '/dashboard/tracking', label: 'Track Status', requiredAbility: { action: 'read', subject: 'Application' }, roles: ['APPLICANT'] },
  { path: '/dashboard/payments', label: 'Payments', requiredAbility: { action: 'read', subject: 'Payment' }, roles: ['APPLICANT'] },
  { path: '/dashboard/permits', label: 'My Permit', requiredAbility: { action: 'read', subject: 'Permit' }, roles: ['APPLICANT'] },
  { path: '/dashboard/profile', label: 'Profile', requiredAbility: { action: 'read', subject: 'User' }, roles: ['APPLICANT'] },

  // BPLO Office Routes
  { path: '/dashboard', label: 'Dashboard', requiredAbility: { action: 'read', subject: 'Application' }, roles: ['BPLO_OFFICE'] },
  { path: '/dashboard/applications', label: 'Applications', requiredAbility: { action: 'read', subject: 'Application' }, roles: ['BPLO_OFFICE'] },
  { path: '/dashboard/verify-documents', label: 'Document Verification', requiredAbility: { action: 'verify', subject: 'Document' }, roles: ['BPLO_OFFICE'] },
  { path: '/dashboard/review', label: 'Review Queue', requiredAbility: { action: 'review', subject: 'Application' }, roles: ['BPLO_OFFICE'] },
  { path: '/dashboard/approved-applications', label: 'Approved Applications', requiredAbility: { action: 'read', subject: 'Application' }, roles: ['BPLO_OFFICE'] },
  { path: '/dashboard/issuance', label: 'Permit Issuance', requiredAbility: { action: 'issue', subject: 'Permit' }, roles: ['BPLO_OFFICE'] },
  { path: '/dashboard/locations', label: 'Business Locations', requiredAbility: { action: 'manage', subject: 'BusinessLocation' }, roles: ['BPLO_OFFICE'] },
  { path: '/dashboard/admin/reports', label: 'Reports', requiredAbility: { action: 'export', subject: 'Report' }, roles: ['BPLO_OFFICE'] },
  { path: '/dashboard/admin/audit-logs', label: 'Activity Logs', requiredAbility: { action: 'read', subject: 'ActivityLog' }, roles: ['BPLO_OFFICE'] },
  { path: '/dashboard/profile', label: 'Profile', requiredAbility: { action: 'read', subject: 'User' }, roles: ['BPLO_OFFICE'] },

  // MTO Routes
  { path: '/dashboard', label: 'Dashboard', requiredAbility: { action: 'read', subject: 'Payment' }, roles: ['MTO'] },
  { path: '/dashboard/payment-queue', label: 'Payment Queue', requiredAbility: { action: 'read', subject: 'Payment' }, roles: ['MTO'] },
  { path: '/dashboard/validate-payments', label: 'Payment Validation', requiredAbility: { action: 'update', subject: 'Payment' }, roles: ['MTO'] },
  { path: '/dashboard/receipts', label: 'Receipts', requiredAbility: { action: 'read', subject: 'Payment' }, roles: ['MTO'] },
  { path: '/dashboard/paid-applications', label: 'Paid Applications', requiredAbility: { action: 'read', subject: 'Payment' }, roles: ['MTO'] },
  { path: '/dashboard/payment-reports', label: 'Payment Reports', requiredAbility: { action: 'export', subject: 'Report' }, roles: ['MTO'] },
  { path: '/dashboard/profile', label: 'Profile', requiredAbility: { action: 'read', subject: 'User' }, roles: ['MTO'] },
];

export function getPermittedNavigation(role: Role): NavPermission[] {
  const ability = defineAbilitiesFor(role);
  return navigationPermissions.filter(
    (nav) =>
      nav.roles.includes(role) &&
      ability.can(nav.requiredAbility.action, nav.requiredAbility.subject)
  );
}
