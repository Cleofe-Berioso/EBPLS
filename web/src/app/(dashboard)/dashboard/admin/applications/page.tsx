import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { FileText, Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { Prisma, ApplicationStatus, ApplicationType } from "@prisma/client";

export const metadata = { title: "All Applications" };

const PAGE_SIZE = 20;

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; type?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const { page, search, status, type } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10));
  const skip = (currentPage - 1) * PAGE_SIZE;

  const where: Prisma.ApplicationWhereInput = {};

  if (status) where.status = status as ApplicationStatus;
  if (type) where.type = type as ApplicationType;
  if (search) {
    where.OR = [
      { businessName: { contains: search, mode: "insensitive" } },
      { applicationNumber: { contains: search, mode: "insensitive" } },
      { applicant: { firstName: { contains: search, mode: "insensitive" } } },
      { applicant: { lastName: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        applicant: { select: { firstName: true, lastName: true, email: true } },
        documents: { select: { id: true, status: true } },
        payments: {
          select: { status: true, amount: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.application.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function buildUrl(p: number) {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    return `/dashboard/admin/applications${params.toString() ? `?${params}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">All Applications</h1>
        <p className="mt-1 text-gray-600">Browse and manage all permit applications system-wide</p>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search business name, applicant, or app #…"
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RETURNED_FOR_CORRECTION">Returned</option>
            <option value="RESUBMITTED">Resubmitted</option>
            <option value="ASSESSED">Assessed</option>
            <option value="PAYMENT_PENDING">Payment Pending</option>
            <option value="PAID">Paid</option>
            <option value="PERMIT_PREPARED">Permit Prepared</option>
            <option value="READY_FOR_RELEASE">Ready for Release</option>
            <option value="RELEASED">Released</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            name="type"
            defaultValue={type ?? ""}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="NEW">New</option>
            <option value="RENEWAL">Renewal</option>
            <option value="CLOSURE">Closure</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            Filter
          </button>
          {(search || status || type) && (
            <Link
              href="/dashboard/admin/applications"
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      {applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-600">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">
            Showing {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total} applications
          </p>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">App #</th>
                  <th className="px-4 py-3 font-semibold">Applicant</th>
                  <th className="px-4 py-3 font-semibold">Business Name</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Docs</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {applications.map((app) => {
                  const docsVerified = app.documents.filter((d) => d.status === "VERIFIED").length;
                  const latestPayment = app.payments[0];
                  return (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-green-600">
                        {app.applicationNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {app.applicant.firstName} {app.applicant.lastName}
                      </td>
                      <td className="px-4 py-3 text-gray-900 max-w-[200px] truncate">
                        {app.businessName}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={app.type} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {docsVerified}/{app.documents.length}
                      </td>
                      <td className="px-4 py-3">
                        {latestPayment ? (
                          <StatusBadge status={latestPayment.status} />
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDate(app.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/review/${app.id}`}
                          className="rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-200 transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {applications.map((app) => {
              const docsVerified = app.documents.filter((d) => d.status === "VERIFIED").length;
              return (
                <div
                  key={app.id}
                  className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-green-600 text-sm">{app.applicationNumber}</p>
                      <p className="mt-0.5 font-medium text-gray-900 text-sm truncate">{app.businessName}</p>
                      <p className="text-xs text-gray-500">
                        {app.applicant.firstName} {app.applicant.lastName}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <StatusBadge status={app.type} />
                    <span className="rounded bg-gray-100 px-2 py-0.5">
                      Docs: {docsVerified}/{app.documents.length}
                    </span>
                    <span>{formatDate(app.createdAt)}</span>
                  </div>
                  <Link
                    href={`/dashboard/review/${app.id}`}
                    className="mt-3 flex w-full items-center justify-center rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                  >
                    View Application
                  </Link>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <p>
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href={buildUrl(currentPage - 1)}
                  aria-disabled={currentPage <= 1}
                  className={`flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 font-medium ${
                    currentPage <= 1
                      ? "pointer-events-none opacity-40"
                      : "hover:bg-gray-50 transition-colors"
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Link>
                <Link
                  href={buildUrl(currentPage + 1)}
                  aria-disabled={currentPage >= totalPages}
                  className={`flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 font-medium ${
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-40"
                      : "hover:bg-gray-50 transition-colors"
                  }`}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
