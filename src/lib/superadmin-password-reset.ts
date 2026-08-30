export const SUPERADMIN_PASSWORD_RESET_ROLES = ["JIT", "DEPARTMENT_HEAD"] as const;

export type SuperAdminPasswordResetRole = (typeof SUPERADMIN_PASSWORD_RESET_ROLES)[number];

export function canSuperAdminResetPassword(role: string): boolean {
  return (SUPERADMIN_PASSWORD_RESET_ROLES as readonly string[]).includes(role);
}
