import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { ClipboardList, Download } from "lucide-react";

export const metadata = { title: "Audit Logs" };

export default async function AuditLogsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      action: true,
      entity: true,
      entityId: true,
      createdAt: true,
      ipAddress: true,
      user: {
        select: { email: true, firstName: true, lastName: true },
      },
    },
  });

  const actionColors: Record<string, string> = {
    LOGIN: "bg-green-100 text-[var(--success)]",
    LOGOUT: "bg-[var(--surface-muted)] text-[var(--text-primary)]",
    REGISTER: "bg-blue-100 text-[var(--accent-hover)]",
    REVIEW_APPROVE: "bg-green-100 text-[var(--success)]",
    REVIEW_REJECT: "bg-red-100 text-[var(--danger)]",
    DOCUMENT_VERIFIED: "bg-green-100 text-[var(--success)]",
    DOCUMENT_REJECTED: "bg-red-100 text-[var(--danger)]",
    RELEASE_PERMIT: "bg-purple-100 text-purple-700",
    ADMIN_UPDATE_USER: "bg-orange-100 text-orange-700",
    ADMIN_CREATE_USER: "bg-blue-100 text-[var(--accent-hover)]",
    UPDATE_SETTINGS: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Audit Logs</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            System activity trail — last 200 events
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-[var(--surface-muted)] px-3 py-2">
            <ClipboardList className="h-4 w-4 text-[var(--text-secondary)]" />
            <span className="text-sm font-medium text-[var(--text-primary)]">{logs.length} events</span>
          </div>
          <a
            href="/api/admin/reports/export?type=audit"
            download
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        </div>
      </div>      <Card>
        <CardContent className="p-0">
          {/* Mobile cards */}
          <div className="divide-y md:hidden">
            {logs.map((log) => (
              <div key={log.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${actionColors[log.action] ?? "bg-[var(--surface-muted)] text-[var(--text-primary)]"}`}>
                    {log.action.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">{formatDate(log.createdAt)}</span>
                </div>
                <div className="mt-1.5">
                  {log.user ? (
                    <p className="text-sm font-medium text-[var(--text-primary)]">{log.user.firstName} {log.user.lastName}</p>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)] italic">System</p>
                  )}
                  <p className="text-xs text-[var(--background)]0">
                    {log.entity}{log.entityId && <span className="ml-1 font-mono">#{log.entityId.slice(-6)}</span>}
                    {log.ipAddress && <span className="ml-2 font-mono">{log.ipAddress}</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-[var(--surface-muted)] text-xs uppercase text-[var(--text-secondary)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Entity</th>
                  <th className="px-4 py-3 font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--surface-muted)]">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--background)]0">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      {log.user ? (
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{log.user.firstName} {log.user.lastName}</p>
                          <p className="text-xs text-[var(--background)]0">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)] italic">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${actionColors[log.action] ?? "bg-[var(--surface-muted)] text-[var(--text-primary)]"}`}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {log.entity}
                      {log.entityId && <span className="ml-1 text-xs text-[var(--text-muted)] font-mono">#{log.entityId.slice(-6)}</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--background)]0">{log.ipAddress ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
