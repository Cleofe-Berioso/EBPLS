import type { Role } from "@/lib/db";

/**
 * Map each role to its home dashboard path.
 */
export const ROLE_HOME: Record<Role, string> = {
  APPLICANT: "/applicant/dashboard",
  BPLO: "/bplo/dashboard",
  SUPER_ADMIN: "/superadmin/dashboard",
};

/**
 * Protected route prefixes and the roles that may access them.
 */
const ROUTE_PERMISSIONS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/applicant", roles: ["APPLICANT"] },
  { prefix: "/bplo", roles: ["BPLO"] },
  { prefix: "/superadmin", roles: ["SUPER_ADMIN"] },
];

/**
 * Workflow ownership policy:
 * - BPLO handles operational workflow actions.
 * - SUPER_ADMIN is view-only for operations and may manage configuration.
 */
export type WorkflowAction =
  | "VIEW_APPLICATIONS"
  | "VIEW_BUSINESS_RECORDS"
  | "VIEW_MAP"
  | "VIEW_REPORTS_DASHBOARD"
  | "MANAGE_CONFIGURATION"
  | "APPROVE_APPLICATION"
  | "REJECT_APPLICATION"
  | "ASSESS_FEES"
  | "VERIFY_PAYMENTS";

const ROLE_WORKFLOW_PERMISSIONS: Record<Role, WorkflowAction[]> = {
  APPLICANT: [],
  BPLO: [
    "VIEW_APPLICATIONS",
    "VIEW_BUSINESS_RECORDS",
    "VIEW_MAP",
    "VIEW_REPORTS_DASHBOARD",
    "APPROVE_APPLICATION",
    "REJECT_APPLICATION",
    "ASSESS_FEES",
    "VERIFY_PAYMENTS",
  ],
  SUPER_ADMIN: [
    "VIEW_APPLICATIONS",
    "VIEW_BUSINESS_RECORDS",
    "VIEW_MAP",
    "VIEW_REPORTS_DASHBOARD",
    "MANAGE_CONFIGURATION",
  ],
};

export function canPerformWorkflowAction(role: Role, action: WorkflowAction): boolean {
  return ROLE_WORKFLOW_PERMISSIONS[role].includes(action);
}

/**
 * Returns true if `role` is allowed to access `pathname`.
 */
export function canAccess(pathname: string, role: Role | undefined): boolean {
  const rule = ROUTE_PERMISSIONS.find((r) => pathname.startsWith(r.prefix));
  if (!rule) return true; // public route
  if (!role) return false; // unauthenticated
  return rule.roles.includes(role);
}

/**
 * Returns true if `pathname` is a protected (dashboard) route.
 */
export function isProtectedRoute(pathname: string): boolean {
  return ROUTE_PERMISSIONS.some((r) => pathname.startsWith(r.prefix));
}
