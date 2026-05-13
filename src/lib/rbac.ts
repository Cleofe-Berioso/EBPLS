import type { Role } from "@/lib/db";

/**
 * Map each role to its home dashboard path.
 */
export const ROLE_HOME: Record<Role, string> = {
  APPLICANT: "/applicant/dashboard",
  BPLO: "/bplo/dashboard",
  SUPER_ADMIN: "/superadmin/dashboard",
  DEPARTMENT_HEAD: "/department-head/dashboard",
  JIT: "/jit/dashboard",
};

/**
 * Protected route prefixes and the roles that may access them.
 */
const ROUTE_PERMISSIONS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/applicant", roles: ["APPLICANT"] },
  { prefix: "/bplo", roles: ["BPLO"] },
  { prefix: "/superadmin", roles: ["SUPER_ADMIN"] },
  { prefix: "/department-head", roles: ["DEPARTMENT_HEAD"] },
  { prefix: "/jit", roles: ["JIT"] },
];

/**
 * Workflow ownership policy:
 * - BPLO handles initial application review.
 * - DEPARTMENT_HEAD reviews applications for approval and revocation decisions.
 * - JIT performs business compliance inspections.
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
  | "VERIFY_PAYMENTS"
  | "INSPECT_BUSINESS"
  | "VIEW_REVOCATION_QUEUE"
  | "APPROVE_REVOCATION";

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
  DEPARTMENT_HEAD: [
    "VIEW_APPLICATIONS",
    "VIEW_BUSINESS_RECORDS",
    "VIEW_MAP",
    "APPROVE_APPLICATION",
    "REJECT_APPLICATION",
    "VIEW_REVOCATION_QUEUE",
    "APPROVE_REVOCATION",
  ],
  JIT: [
    "VIEW_BUSINESS_RECORDS",
    "VIEW_MAP",
    "INSPECT_BUSINESS",
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
