import { AbilityBuilder, createMongoAbility, type MongoAbility } from "@casl/ability";

type Actions =
  | "manage"
  | "create"
  | "read"
  | "update"
  | "delete"
  | "submit"
  | "resubmit"
  | "review"
  | "verify"
  | "return"
  | "assess"
  | "confirm"
  | "issue"
  | "release"
  | "export";

type Subjects =
  | "Application"
  | "Document"
  | "Payment"
  | "Permit"
  | "PermitIssuance"
  | "User"
  | "Report"
  | "SystemSetting"
  | "ActivityLog"
  | "BusinessLocation"
  | "all";

export type AppAbility = MongoAbility<[Actions, Subjects]>;
export type Role = "APPLICANT" | "BPLO_OFFICE" | "ADMIN";

export function defineAbilitiesFor(role: Role, userId?: string): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (role === "BPLO_OFFICE") {
    can(["read", "review", "return", "assess", "update"], "Application");
    can(["read", "verify", "update"], "Document");
    can(["read", "confirm", "update"], "Payment");
    can(["read", "issue", "release"], "Permit");
    can(["read", "update"], "PermitIssuance");
    can("read", "BusinessLocation");
    can("read", "Report");
  } else if (role === "ADMIN") {
    can("manage", "User");
    can("manage", "SystemSetting");
    can("manage", "BusinessLocation");
    can("read", "ActivityLog");
    can("export", "Report");
    can("read", "Report");
    can("read", "Application");
    can("read", "Payment");
    can("read", "Permit");
  } else if (role === "APPLICANT") {
    can(["create", "read", "update", "submit", "resubmit"], "Application");
    can(["create", "read", "update"], "Document");
    can("read", "Payment");
    can("create", "Payment");
    can("read", "Permit");
    cannot(["review", "verify", "return", "assess"], "Application");
    cannot("verify", "Document");
    cannot("confirm", "Payment");
    cannot(["issue", "release"], "Permit");
    cannot("manage", "User");
  }

  return build();
}

export function canPerformAction(role: Role, action: Actions, subject: Subjects): boolean {
  return defineAbilitiesFor(role).can(action, subject);
}

export interface NavPermission {
  path: string;
  label: string;
  requiredAbility: { action: Actions; subject: Subjects };
  roles: Role[];
}

export const NAV_PERMISSIONS: NavPermission[] = [
  { path: "/dashboard", label: "Dashboard", requiredAbility: { action: "read", subject: "Application" }, roles: ["APPLICANT", "BPLO_OFFICE", "ADMIN"] },
  { path: "/dashboard/applications", label: "Applications", requiredAbility: { action: "read", subject: "Application" }, roles: ["APPLICANT", "BPLO_OFFICE"] },
  { path: "/dashboard/documents", label: "Documents", requiredAbility: { action: "read", subject: "Document" }, roles: ["APPLICANT"] },
  { path: "/dashboard/tracking", label: "Track Status", requiredAbility: { action: "read", subject: "Application" }, roles: ["APPLICANT"] },
  { path: "/dashboard/payments", label: "Payments", requiredAbility: { action: "read", subject: "Payment" }, roles: ["APPLICANT", "BPLO_OFFICE"] },
  { path: "/dashboard/permits", label: "Permits", requiredAbility: { action: "read", subject: "Permit" }, roles: ["APPLICANT", "BPLO_OFFICE"] },
  { path: "/dashboard/profile", label: "Profile", requiredAbility: { action: "read", subject: "User" }, roles: ["APPLICANT", "BPLO_OFFICE", "ADMIN"] },
  { path: "/dashboard/verify-documents", label: "Document Verification", requiredAbility: { action: "verify", subject: "Document" }, roles: ["BPLO_OFFICE"] },
  { path: "/dashboard/review", label: "Review Queue", requiredAbility: { action: "review", subject: "Application" }, roles: ["BPLO_OFFICE"] },
  { path: "/dashboard/payment-queue", label: "Payment Queue", requiredAbility: { action: "confirm", subject: "Payment" }, roles: ["BPLO_OFFICE"] },
  { path: "/dashboard/validate-payments", label: "Payment Validation", requiredAbility: { action: "confirm", subject: "Payment" }, roles: ["BPLO_OFFICE"] },
  { path: "/dashboard/paid-applications", label: "Paid Applications", requiredAbility: { action: "read", subject: "Payment" }, roles: ["BPLO_OFFICE"] },
  { path: "/dashboard/payment-reports", label: "Payment Reports", requiredAbility: { action: "export", subject: "Report" }, roles: ["BPLO_OFFICE"] },
  { path: "/dashboard/receipts", label: "Receipts", requiredAbility: { action: "read", subject: "Payment" }, roles: ["BPLO_OFFICE"] },
  { path: "/dashboard/issuance", label: "Permit Issuance", requiredAbility: { action: "issue", subject: "Permit" }, roles: ["BPLO_OFFICE"] },
  { path: "/dashboard/admin/applications", label: "All Applications", requiredAbility: { action: "read", subject: "Application" }, roles: ["ADMIN"] },
  { path: "/dashboard/admin/reports", label: "Reports", requiredAbility: { action: "export", subject: "Report" }, roles: ["ADMIN"] },
  { path: "/dashboard/admin/audit-logs", label: "Activity Logs", requiredAbility: { action: "read", subject: "ActivityLog" }, roles: ["ADMIN"] },
  { path: "/dashboard/admin/users", label: "Users", requiredAbility: { action: "manage", subject: "User" }, roles: ["ADMIN"] },
  { path: "/dashboard/admin/settings", label: "Settings", requiredAbility: { action: "manage", subject: "SystemSetting" }, roles: ["ADMIN"] },
  { path: "/dashboard/admin/locations", label: "Business Locations", requiredAbility: { action: "read", subject: "BusinessLocation" }, roles: ["ADMIN", "BPLO_OFFICE"] },
];

export function getPermittedNavigation(role: Role): NavPermission[] {
  return NAV_PERMISSIONS.filter((permission) => permission.roles.includes(role));
}
