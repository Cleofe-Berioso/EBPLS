"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { InfoBanner } from "@/components/ui/info-banner";
import { RoleBadge } from "@/components/ui/role-badge";
import { StatCard } from "@/components/ui/stat-card";
import { ResponsiveDataTable } from "@/components/ui/responsive-data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { actionButtonStyles } from "@/components/ui/action-button";

type RoleFilter = "ALL" | "APPLICANT" | "BPLO" | "SUPER_ADMIN";
type StatusFilter = "ALL" | "ACTIVE" | "DISABLED";
type UserRole = "APPLICANT" | "BPLO" | "SUPER_ADMIN";
type UserStatus = "ACTIVE" | "DISABLED";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
};

type UserSummary = {
  totalUsers: number;
  applicants: number;
  bploAccounts: number;
  superAdmins: number;
  activeUsers: number;
  disabledUsers: number;
};

type Flash = { type: "success" | "danger" | "info"; message: string } | null;

const EMPTY_SUMMARY: UserSummary = {
  totalUsers: 0,
  applicants: 0,
  bploAccounts: 0,
  superAdmins: 0,
  activeUsers: 0,
  disabledUsers: 0,
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-PH");
}

function statusBadge(status: UserStatus) {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-green-900">
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
      Disabled
    </span>
  );
}

export function SuperAdminUsersManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [summary, setSummary] = useState<UserSummary>(EMPTY_SUMMARY);
  const [searchInput, setSearchInput] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [flash, setFlash] = useState<Flash>(null);

  const [viewedUser, setViewedUser] = useState<UserRow | null>(null);
  const [resetUser, setResetUser] = useState<UserRow | null>(null);
  const [showCreateBplo, setShowCreateBplo] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [resetForm, setResetForm] = useState({
    temporaryPassword: "",
    confirmPassword: "",
  });

  async function loadUsers(next?: { search?: string; role?: RoleFilter; status?: StatusFilter }) {
    const search = next?.search ?? searchApplied;
    const role = next?.role ?? roleFilter;
    const status = next?.status ?? statusFilter;

    setIsLoading(true);
    setFlash(null);

    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (role !== "ALL") params.set("role", role);
      if (status !== "ALL") params.set("status", status);

      const res = await fetch(`/api/superadmin/users?${params.toString()}`, { cache: "no-store" });
      const json = (await res.json()) as {
        users?: UserRow[];
        summary?: UserSummary;
        error?: string;
      };

      if (!res.ok) {
        setFlash({ type: "danger", message: json.error ?? "Failed to load users." });
        setUsers([]);
        setSummary(EMPTY_SUMMARY);
        return;
      }

      setUsers(json.users ?? []);
      setSummary(json.summary ?? EMPTY_SUMMARY);
    } catch {
      setFlash({ type: "danger", message: "Failed to load users." });
      setUsers([]);
      setSummary(EMPTY_SUMMARY);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers({ search: "", role: "ALL", status: "ALL" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCountLabel = useMemo(() => {
    return `${users.length} user record${users.length === 1 ? "" : "s"} matched the current filters.`;
  }, [users.length]);

  async function submitCreateBplo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFlash(null);

    try {
      const res = await fetch("/api/superadmin/users/bplo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFlash({ type: "danger", message: json.error ?? "Failed to create BPLO account." });
        return;
      }

      setShowCreateBplo(false);
      setCreateForm({ name: "", email: "", password: "", confirmPassword: "" });
      setFlash({ type: "success", message: "BPLO account created successfully." });
      await loadUsers();
    } catch {
      setFlash({ type: "danger", message: "Failed to create BPLO account." });
    }
  }

  async function disableUser(user: UserRow) {
    setFlash(null);

    try {
      const res = await fetch(`/api/superadmin/users/${user.id}/disable`, { method: "POST" });
      const json = (await res.json()) as { error?: string };

      if (!res.ok) {
        setFlash({ type: "danger", message: json.error ?? "Unable to disable account." });
        return;
      }

      setFlash({ type: "success", message: `Disabled account: ${user.email}` });
      await loadUsers();
    } catch {
      setFlash({ type: "danger", message: "Unable to disable account." });
    }
  }

  async function reactivateUser(user: UserRow) {
    setFlash(null);

    try {
      const res = await fetch(`/api/superadmin/users/${user.id}/reactivate`, { method: "POST" });
      const json = (await res.json()) as { error?: string };

      if (!res.ok) {
        setFlash({ type: "danger", message: json.error ?? "Unable to reactivate account." });
        return;
      }

      setFlash({ type: "success", message: `Reactivated account: ${user.email}` });
      await loadUsers();
    } catch {
      setFlash({ type: "danger", message: "Unable to reactivate account." });
    }
  }

  async function submitResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!resetUser) return;

    setFlash(null);

    try {
      const res = await fetch(`/api/superadmin/users/${resetUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resetForm),
      });

      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFlash({ type: "danger", message: json.error ?? "Unable to reset password." });
        return;
      }

      setShowResetPassword(false);
      setResetUser(null);
      setResetForm({ temporaryPassword: "", confirmPassword: "" });
      setFlash({ type: "success", message: `Temporary password reset for ${resetUser.email}.` });
    } catch {
      setFlash({ type: "danger", message: "Unable to reset password." });
    }
  }

  const flashVariant = flash?.type === "danger" ? "danger" : flash?.type === "success" ? "success" : "info";

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Super Admin"
        eyebrowClassName="text-slate-600"
        title="User Management"
        description="Manage controlled system accounts and monitor registered applicants."
        badge={<RoleBadge role="VIEW_ONLY" label="Controlled Accounts" />}
        actions={
          <button
            type="button"
            onClick={() => setShowCreateBplo(true)}
            className={actionButtonStyles("primary", "sm")}
          >
            Create BPLO Account
          </button>
        }
      />

      <InfoBanner
        title="Super Admin scope"
        description="User account management is available here, while BPLO application workflow actions remain unavailable for Super Admin."
        variant="readOnly"
      />

      {flash ? <InfoBanner title={flash.message} variant={flashVariant} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Users" value={summary.totalUsers.toLocaleString("en-PH")} subtitle="All registered accounts" tone="slate" />
        <StatCard title="Applicants" value={summary.applicants.toLocaleString("en-PH")} subtitle="Public applicant accounts" tone="green" />
        <StatCard title="BPLO Accounts" value={summary.bploAccounts.toLocaleString("en-PH")} subtitle="Controlled operations users" tone="blue" />
        <StatCard title="Super Admins" value={summary.superAdmins.toLocaleString("en-PH")} subtitle="Controlled oversight users" tone="slate" />
        <StatCard
          title="Active / Disabled"
          value={`${summary.activeUsers.toLocaleString("en-PH")} / ${summary.disabledUsers.toLocaleString("en-PH")}`}
          subtitle="Account status overview"
          tone="slate"
        />
      </div>

      <FilterBar title="Search and Filters" description="Search by name/email and filter by role/status.">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search name or email"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
        >
          <option value="ALL">All Roles</option>
          <option value="APPLICANT">Applicant</option>
          <option value="BPLO">BPLO</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="DISABLED">Disabled</option>
        </select>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={actionButtonStyles("readOnly", "sm")}
            onClick={async () => {
              setSearchApplied(searchInput.trim());
              await loadUsers({ search: searchInput.trim(), role: roleFilter, status: statusFilter });
            }}
            disabled={isLoading}
          >
            Apply
          </button>
          <button
            type="button"
            className={actionButtonStyles("secondary", "sm")}
            onClick={async () => {
              setSearchInput("");
              setSearchApplied("");
              setRoleFilter("ALL");
              setStatusFilter("ALL");
              await loadUsers({ search: "", role: "ALL", status: "ALL" });
            }}
            disabled={isLoading}
          >
            Reset
          </button>
        </div>
      </FilterBar>

      <ResponsiveDataTable
        title="User Directory"
        description={isLoading ? "Loading users..." : filteredCountLabel}
        table={
          users.length === 0 && !isLoading ? (
            <div className="p-5">
              <EmptyState title="No user records found" description="Try adjusting the current filters." />
            </div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Created Date</th>
                  <th className="px-4 py-3 font-semibold">Last Updated</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const canToggleStatus = user.role !== "SUPER_ADMIN";
                  const canResetPassword = user.role === "BPLO";

                  return (
                    <tr key={user.id} className="align-top hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                      <td className="max-w-[16rem] break-all px-4 py-3 text-slate-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-4 py-3">{statusBadge(user.status)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(user.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className={actionButtonStyles("secondary", "sm")}
                            onClick={() => setViewedUser(user)}
                          >
                            View
                          </button>

                          {canToggleStatus ? (
                            user.status === "ACTIVE" ? (
                              <button
                                type="button"
                                className={actionButtonStyles("warning", "sm")}
                                onClick={() => void disableUser(user)}
                              >
                                Disable
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={actionButtonStyles("secondary", "sm")}
                                onClick={() => void reactivateUser(user)}
                              >
                                Reactivate
                              </button>
                            )
                          ) : null}

                          {canResetPassword ? (
                            <button
                              type="button"
                              className={actionButtonStyles("readOnly", "sm")}
                              onClick={() => {
                                setResetUser(user);
                                setShowResetPassword(true);
                              }}
                            >
                              Reset Password
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        }
        mobile={
          users.length === 0 && !isLoading ? (
            <div className="p-5">
              <EmptyState title="No user records found" description="Try adjusting the current filters." />
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {users.map((user) => {
                const canToggleStatus = user.role !== "SUPER_ADMIN";
                const canResetPassword = user.role === "BPLO";

                return (
                  <article key={user.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                        <p className="break-all text-xs text-slate-600">{user.email}</p>
                      </div>
                      {statusBadge(user.status)}
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <RoleBadge role={user.role} />
                    </div>

                    <p className="mt-2 text-xs text-slate-500">Created: {formatDate(user.createdAt)}</p>
                    <p className="text-xs text-slate-500">Updated: {formatDate(user.updatedAt)}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={actionButtonStyles("secondary", "sm")}
                        onClick={() => setViewedUser(user)}
                      >
                        View
                      </button>

                      {canToggleStatus ? (
                        user.status === "ACTIVE" ? (
                          <button
                            type="button"
                            className={actionButtonStyles("warning", "sm")}
                            onClick={() => void disableUser(user)}
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={actionButtonStyles("secondary", "sm")}
                            onClick={() => void reactivateUser(user)}
                          >
                            Reactivate
                          </button>
                        )
                      ) : null}

                      {canResetPassword ? (
                        <button
                          type="button"
                          className={actionButtonStyles("readOnly", "sm")}
                          onClick={() => {
                            setResetUser(user);
                            setShowResetPassword(true);
                          }}
                        >
                          Reset Password
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )
        }
      />

      {showCreateBplo ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Create BPLO Account</h3>
            <p className="mt-1 text-sm text-slate-600">Role is fixed to BPLO for controlled account provisioning.</p>

            <form className="mt-4 space-y-3" onSubmit={submitCreateBplo}>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input
                  value={createForm.email}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                  type="email"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Temporary Password</label>
                  <input
                    value={createForm.password}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                    required
                    minLength={8}
                    type="password"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Confirm Password</label>
                  <input
                    value={createForm.confirmPassword}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    minLength={8}
                    type="password"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
                <input
                  value="BPLO"
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  className={actionButtonStyles("secondary", "sm")}
                  onClick={() => setShowCreateBplo(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={actionButtonStyles("primary", "sm")}>Create BPLO Account</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {viewedUser ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">User Details</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p><span className="font-semibold">Name:</span> {viewedUser.name}</p>
              <p><span className="font-semibold">Email:</span> {viewedUser.email}</p>
              <p><span className="font-semibold">Role:</span> {viewedUser.role}</p>
              <p><span className="font-semibold">Status:</span> {viewedUser.status}</p>
              <p><span className="font-semibold">Created:</span> {formatDate(viewedUser.createdAt)}</p>
              <p><span className="font-semibold">Updated:</span> {formatDate(viewedUser.updatedAt)}</p>
              <p><span className="font-semibold">Last Login:</span> -</p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className={actionButtonStyles("secondary", "sm")}
                onClick={() => {
                  setViewedUser(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showResetPassword && resetUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Reset Temporary Password</h3>
            <p className="mt-1 text-sm text-slate-600">Set a temporary password for {resetUser.email}.</p>

            <form className="mt-4 space-y-3" onSubmit={submitResetPassword}>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Temporary Password</label>
                <input
                  value={resetForm.temporaryPassword}
                  onChange={(e) => setResetForm((prev) => ({ ...prev, temporaryPassword: e.target.value }))}
                  required
                  minLength={8}
                  type="password"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Confirm Password</label>
                <input
                  value={resetForm.confirmPassword}
                  onChange={(e) => setResetForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  minLength={8}
                  type="password"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  className={actionButtonStyles("secondary", "sm")}
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetUser(null);
                    setResetForm({ temporaryPassword: "", confirmPassword: "" });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className={actionButtonStyles("primary", "sm")}>Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
