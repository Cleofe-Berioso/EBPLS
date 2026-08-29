import { describe, expect, it } from "vitest";
import {
  ROLE_HOME,
  canAccess,
  canPerformWorkflowAction,
  isProtectedRoute,
  type WorkflowAction,
} from "@/lib/rbac";
import type { Role } from "@/lib/db";

const ROLES: Role[] = ["APPLICANT", "BPLO", "DEPARTMENT_HEAD", "JIT", "SUPER_ADMIN"];

describe("WB-RBAC — roles, routes, workflow actions", () => {
  it("WB-RBAC-01 every role has a home path", () => {
    expect(ROLE_HOME.APPLICANT).toBe("/applicant/dashboard");
    expect(ROLE_HOME.BPLO).toBe("/bplo/dashboard");
    expect(ROLE_HOME.DEPARTMENT_HEAD).toBe("/department-head/dashboard");
    expect(ROLE_HOME.JIT).toBe("/jit/dashboard");
    expect(ROLE_HOME.SUPER_ADMIN).toBe("/superadmin/dashboard");
  });

  it("WB-RBAC-02 portal prefixes are exclusive per role", () => {
    const matrix: Array<[string, Role, boolean]> = [
      ["/applicant/dashboard", "APPLICANT", true],
      ["/applicant/top", "BPLO", false],
      ["/bplo/applications", "BPLO", true],
      ["/bplo/payment-verification", "DEPARTMENT_HEAD", false],
      ["/department-head/permit-to-revoke", "DEPARTMENT_HEAD", true],
      ["/department-head/dashboard", "JIT", false],
      ["/jit/inspect-a-business", "JIT", true],
      ["/jit/dashboard", "SUPER_ADMIN", false],
      ["/superadmin/users", "SUPER_ADMIN", true],
      ["/superadmin/settings", "APPLICANT", false],
    ];
    for (const [path, role, allowed] of matrix) {
      expect(canAccess(path, role), `${role} ${path}`).toBe(allowed);
    }
  });

  it("WB-RBAC-03 unauthenticated cannot access protected prefixes", () => {
    expect(canAccess("/applicant/dashboard", undefined)).toBe(false);
    expect(canAccess("/bplo/dashboard", undefined)).toBe(false);
    expect(isProtectedRoute("/applicant/profile")).toBe(true);
    expect(isProtectedRoute("/login")).toBe(false);
  });

  it("WB-RBAC-04 public paths remain open", () => {
    expect(canAccess("/login", undefined)).toBe(true);
    expect(canAccess("/register", "APPLICANT")).toBe(true);
    expect(canAccess("/", "BPLO")).toBe(true);
  });

  it("WB-RBAC-05 SUPER_ADMIN cannot perform operational approve/assess/pay/inspect", () => {
    const forbidden: WorkflowAction[] = [
      "APPROVE_APPLICATION",
      "REJECT_APPLICATION",
      "ASSESS_FEES",
      "VERIFY_PAYMENTS",
      "INSPECT_BUSINESS",
      "APPROVE_REVOCATION",
    ];
    for (const action of forbidden) {
      expect(canPerformWorkflowAction("SUPER_ADMIN", action), action).toBe(false);
    }
    expect(canPerformWorkflowAction("SUPER_ADMIN", "MANAGE_CONFIGURATION")).toBe(true);
    expect(canPerformWorkflowAction("SUPER_ADMIN", "VIEW_APPLICATIONS")).toBe(true);
  });

  it("WB-RBAC-06 BPLO vs DH vs JIT workflow ownership", () => {
    expect(canPerformWorkflowAction("BPLO", "ASSESS_FEES")).toBe(true);
    expect(canPerformWorkflowAction("BPLO", "VERIFY_PAYMENTS")).toBe(true);
    expect(canPerformWorkflowAction("BPLO", "APPROVE_REVOCATION")).toBe(false);

    expect(canPerformWorkflowAction("DEPARTMENT_HEAD", "APPROVE_APPLICATION")).toBe(true);
    expect(canPerformWorkflowAction("DEPARTMENT_HEAD", "APPROVE_REVOCATION")).toBe(true);
    expect(canPerformWorkflowAction("DEPARTMENT_HEAD", "ASSESS_FEES")).toBe(false);

    expect(canPerformWorkflowAction("JIT", "INSPECT_BUSINESS")).toBe(true);
    expect(canPerformWorkflowAction("JIT", "APPROVE_APPLICATION")).toBe(false);

    expect(canPerformWorkflowAction("APPLICANT", "VIEW_APPLICATIONS")).toBe(false);
  });

  it("WB-RBAC-07 cross-role sweep: no role accesses another portal home", () => {
    for (const role of ROLES) {
      for (const other of ROLES) {
        if (role === other) continue;
        const foreignHome = ROLE_HOME[other];
        expect(canAccess(foreignHome, role), `${role} -> ${foreignHome}`).toBe(false);
      }
    }
  });
});
