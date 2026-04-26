import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { CheckSquare, Search, ChevronLeft, ChevronRight, FileText } from "lucide-react";

export const metadata = { title: "Review Applications" };

import { type ApplicationStatus } from "@prisma/client";

const PAGE_SIZE = 15;

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "BPLO_OFFICE") redirect("/dashboard");

  const { page, search, status } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10));
  const skip = (currentPage - 1) * PAGE_SIZE;

  const statusFilter: ApplicationStatus[] = status
    ? [status as ApplicationStatus]
    : ["SUBMITTED", "RESUBMITTED", "UNDER_REVIEW"];

  const where = {
    status: { in: statusFilter },
    ...(search ? {
      OR: [
        { businessName: { contains: search, mode: "insensitive" as const } },
        { applicationNumber: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      orderBy: { submittedAt: "asc" },
      skip,
      take: PAGE_SIZE,
      include: {
        applicant: { select: { firstName: true, lastName: true, email: true } },
        documents: { select: { id: true, status: true } },
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
    return `/dashboard/review${params.toString() ? `?${params}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Applications Queue</h1>
        <p className="mt-1 text-gray-600">Review and process pending permit applications</p>
      </div>

      {/* Search & Filter */}
      <form
        method="GET"
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search business name, owner, or application #…"
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent sm:flex-none"
          >
            <option value="">Pending</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="RESUBMITTED">Resubmitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RETURNED_FOR_CORRECTION">Returned</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            Filter
          </button>
          {(search || status) && (
            <Link
              href="/dashboard/review"
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      {applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending applications</h3>
          <p className="text-gray-600">All applications have been reviewed. Check back later.</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {applications.map((app) => {
              const docsVerified = app.documents.filter((d) => d.status === "VERIFIED").length;
              return (
                <div
                  key={app.id}
                  className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-green-600 text-sm">{app.applicationNumber}</p>
                      <p className="mt-0.5 font-medium text-gray-900 text-sm truncate">{app.businessName}</p>
                      <p className="text-xs text-gray-500">{app.applicant.firstName} {app.applicant.lastName}</p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <StatusBadge status={app.type} />
                    <span className="rounded bg-gray-100 px-2 py-0.5">
                      Docs: {docsVerified}/{app.documents.length}
                    </span>
                    {app.submittedAt && <span>{formatDate(app.submittedAt)}</span>}
                  </div>
                  <Link
                    href={`/dashboard/review/${app.id}`}
                    className="mt-3 flex w-full items-center justify-center rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                  >
                    Review Application
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Application #</th>
                  <th className="px-4 py-3 font-semibold">Applicant</th>
                  <th className="px-4 py-3 font-semibold">Business Name</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Docs</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {applications.map((app) => {
                  const docsVerified = app.documents.filter((d) => d.status === "VERIFIED").length;
                  return (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-green-600">
                        {app.applicationNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {app.applicant.firstName} {app.applicant.lastName}
                      </td>
                      <td className="px-4 py-3 text-gray-900">{app.businessName}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={app.type} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {docsVerified}/{app.documents.length}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {app.submittedAt ? formatDate(app.submittedAt) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/review/${app.id}`}
                          className="rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-200 transition-colors"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <p>
                Showing {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total}
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
                <span className="px-2">
                  Page {currentPage} of {totalPages}
                </span>
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
