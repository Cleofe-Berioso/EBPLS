"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  Shield,
  MoreVertical,
  UserPlus,
  KeyRound,
  Ban,
  CheckCircle,
  Pencil,
  X,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type Role = "APPLICANT" | "BPLO_OFFICE" | "ADMIN";
type Status = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: Status;
  lastLoginAt: string | null;
  createdAt: string;
  _count: { applications: number };
}

interface Props {
  initialUsers: User[];
  initialTotal: number;
}

const PAGE_SIZE = 15;
const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "APPLICANT", label: "Applicant" },
  { value: "BPLO_OFFICE", label: "BPLO Office" },
  { value: "ADMIN", label: "Admin" },
];
const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "PENDING_VERIFICATION", label: "Pending Verification" },
];

// ─── Create User Modal ───────────────────────────────────────────────────────
function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: (user: User, pw: string) => void }) {
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", role: "APPLICANT" as Role, phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      onCreated(data.user, data.tempPassword);
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Create User Account</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
              <input required className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
              <input required className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input required type="email" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone (optional)</label>
            <input className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
            <select className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}>
              <option value="APPLICANT">Applicant</option>
              <option value="BPLO_OFFICE">BPLO Office</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Temp Password Modal ─────────────────────────────────────────────────────
function TempPasswordModal({ user, password, onClose }: { user: User; password: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Temporary Password</h2>
        <p className="mb-3 text-sm text-gray-600">Share this temporary password with <strong>{user.firstName} {user.lastName}</strong>. They must change it on first login.</p>
        <div className="rounded-lg bg-gray-100 px-4 py-3 font-mono text-base font-bold text-gray-900 select-all">{password}</div>
        <button onClick={onClose} className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Done</button>
      </div>
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────
export function AdminUsersClient({ initialUsers, initialTotal }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fetching, setFetching] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [tempPw, setTempPw] = useState<{ user: User; password: string } | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchUsers = useCallback(
    async (p: number, q: string, role: string, status: string) => {
      setFetching(true);
      try {
        const params = new URLSearchParams({ page: String(p) });
        if (q) params.set("search", q);
        if (role) params.set("role", role);
        if (status) params.set("status", status);
        const res = await fetch(`/api/admin/users?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
      } finally {
        setFetching(false);
      }
    },
    []
  );

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchUsers(1, search, roleFilter, statusFilter);
    }, 350);
    return () => clearTimeout(t);
  }, [search, roleFilter, statusFilter, fetchUsers]);

  function goToPage(p: number) {
    setPage(p);
    fetchUsers(p, search, roleFilter, statusFilter);
  }

  async function updateUser(id: string, changes: Record<string, unknown>) {
    setLoadingId(id);
    setOpenMenu(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed"); return; }
      setUsers(u => u.map(usr => usr.id === id ? { ...usr, ...data.user } : usr));
      if (data.tempPassword) {
        const user = users.find(u => u.id === id)!;
        setTempPw({ user, password: data.tempPassword });
      }
      router.refresh();
    } finally { setLoadingId(null); }
  }

  return (
    <div>      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="mt-1 text-sm text-gray-600">View and manage system users and their roles</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">{total} users</span>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:flex-none"
          >
            <UserPlus className="h-4 w-4" />
            Create User
          </button>
        </div>
      </div>{/* Search & Filters */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:flex-none"
          >
            {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:flex-none"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div><div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Mobile cards */}
        <div className="divide-y md:hidden">
          {fetching ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            </div>
          ) : users.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">No users found.</p>
          ) : users.map((user, index) => {
            const openUpward = users.length - index <= 2;

            return (
            <div key={user.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                    className="rounded-lg p-1.5 hover:bg-gray-100"
                    disabled={loadingId === user.id}
                  >
                    {loadingId === user.id
                      ? <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      : <MoreVertical className="h-4 w-4 text-gray-500" />}
                  </button>
                  {openMenu === user.id && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setOpenMenu(null)} />
                      <div className={`absolute right-0 z-40 w-48 rounded-lg border bg-white py-1 shadow-lg ${
                        openUpward ? "bottom-full mb-1" : "mt-1"
                      }`}>
                        <button onClick={() => updateUser(user.id, { role: "APPLICANT" })} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <Pencil className="h-4 w-4 text-blue-500" /> Set as Applicant
                        </button>
                        <button onClick={() => updateUser(user.id, { role: "BPLO_OFFICE" })} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <Pencil className="h-4 w-4 text-blue-500" /> Set as BPLO Office
                        </button>
                        <button onClick={() => updateUser(user.id, { role: "ADMIN" })} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <Pencil className="h-4 w-4 text-blue-500" /> Set as Admin
                        </button>
                        {user.status === "ACTIVE" ? (
                          <button onClick={() => updateUser(user.id, { status: "SUSPENDED" })} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <Ban className="h-4 w-4 text-orange-500" /> Suspend Account
                          </button>
                        ) : (
                          <button onClick={() => updateUser(user.id, { status: "ACTIVE" })} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <CheckCircle className="h-4 w-4 text-green-500" /> Activate Account
                          </button>
                        )}
                        <hr className="my-1" />
                        <button onClick={() => { if (confirm("Reset password for this user?")) updateUser(user.id, { resetPassword: true }); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                          <KeyRound className="h-4 w-4" /> Reset Password
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 capitalize">
                  <Shield className="h-3 w-3" />{user.role.toLowerCase().replace("_", " ")}
                </span>
                <StatusBadge status={user.status} />
                <span className="text-xs text-gray-400">{user._count.applications} apps</span>
              </div>
              <p className="mt-1 text-xs text-gray-400">Last login: {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}</p>
            </div>
          )})}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-center">Apps</th>
                <th className="px-4 py-3 font-semibold">Last Login</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {fetching ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-blue-500" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : users.map((user, index) => {
                const openUpward = users.length - index <= 2;

                return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <span className="font-medium text-gray-900 whitespace-nowrap">{user.firstName} {user.lastName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 capitalize">
                      <Shield className="h-3 w-3" />
                      {user.role.toLowerCase().replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                  <td className="px-4 py-3 text-center text-gray-600">{user._count.applications}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                        className="rounded-lg p-1.5 hover:bg-gray-100"
                        disabled={loadingId === user.id}
                      >
                        {loadingId === user.id
                          ? <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                          : <MoreVertical className="h-4 w-4 text-gray-500" />}
                      </button>
                      {openMenu === user.id && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setOpenMenu(null)} />
                          <div className={`absolute right-0 z-40 w-48 rounded-lg border bg-white py-1 shadow-lg ${
                            openUpward ? "bottom-full mb-1" : "mt-1"
                          }`}>
                            <button onClick={() => updateUser(user.id, { role: "APPLICANT" })} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              <Pencil className="h-4 w-4 text-blue-500" />
                              Set as Applicant
                            </button>
                            <button onClick={() => updateUser(user.id, { role: "BPLO_OFFICE" })} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              <Pencil className="h-4 w-4 text-blue-500" />
                              Set as BPLO Office
                            </button>
                            <button onClick={() => updateUser(user.id, { role: "ADMIN" })} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              <Pencil className="h-4 w-4 text-blue-500" />
                              Set as Admin
                            </button>
                            {user.status === "ACTIVE" ? (
                              <button
                                onClick={() => updateUser(user.id, { status: "SUSPENDED" })}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Ban className="h-4 w-4 text-orange-500" />
                                Suspend Account
                              </button>
                            ) : (
                              <button
                                onClick={() => updateUser(user.id, { status: "ACTIVE" })}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                Activate Account
                              </button>
                            )}
                            <hr className="my-1" />
                            <button
                              onClick={() => { if (confirm("Reset password for this user?")) updateUser(user.id, { resetPassword: true }); }}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <KeyRound className="h-4 w-4" />
                              Reset Password
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-gray-600">
              Page {page} of {totalPages} &mdash; {total} total users
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || fetching}
                className="rounded-lg border p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const n = start + i;
                return (
                  <button
                    key={n}
                    onClick={() => goToPage(n)}
                    disabled={fetching}
                    className={`min-w-[2rem] rounded-lg border px-2 py-1 text-sm font-medium ${
                      n === page
                        ? "bg-blue-600 text-white border-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages || fetching}
                className="rounded-lg border p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={(user, pw) => {
            setUsers(u => [user as User, ...u]);
            setTotal(t => t + 1);
            setShowCreate(false);
            setTempPw({ user: user as User, password: pw });
          }}
        />
      )}

      {tempPw && (
        <TempPasswordModal
          user={tempPw.user}
          password={tempPw.password}
          onClose={() => setTempPw(null)}
        />
      )}
    </div>
  );
}
