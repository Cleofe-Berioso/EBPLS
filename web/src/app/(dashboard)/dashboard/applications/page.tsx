import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Eye, FileText, RefreshCw, XCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";

export default async function ApplicationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const applications = await prisma.application.findMany({
    where: session.user.role === "APPLICANT" ? { applicantId: session.user.id } : {},
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      applicationNumber: true,
      type: true,
      status: true,
      businessName: true,
      businessType: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">New Application</h1>
        <p className="mt-1 text-gray-600">Select application type to begin</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Link
          href="/dashboard/applications/new"
          className="group rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-8 text-white shadow-lg transition-shadow hover:shadow-xl"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-white/20 p-4">
              <Plus className="h-12 w-12" />
            </div>
            <h3 className="mb-2 text-2xl font-bold">New Application</h3>
            <p className="mb-6 text-sm text-green-100">Apply for a new business permit</p>
            <span className="rounded-lg bg-white px-6 py-2 font-semibold text-green-600 transition-colors hover:bg-green-50">
              Start Application
            </span>
          </div>
        </Link>

        <Link
          href="/dashboard/renew"
          className="group rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-8 text-white shadow-lg transition-shadow hover:shadow-xl"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-white/20 p-4">
              <RefreshCw className="h-12 w-12" />
            </div>
            <h3 className="mb-2 text-2xl font-bold">Renewal</h3>
            <p className="mb-6 text-sm text-blue-100">Renew your existing business permit</p>
            <span className="rounded-lg bg-white px-6 py-2 font-semibold text-blue-600 transition-colors hover:bg-blue-50">
              Renew Permit
            </span>
          </div>
        </Link>

        <Link
          href="/dashboard/applications/closure"
          className="group rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-8 text-white shadow-lg transition-shadow hover:shadow-xl"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-white/20 p-4">
              <XCircle className="h-12 w-12" />
            </div>
            <h3 className="mb-2 text-2xl font-bold">Closure</h3>
            <p className="mb-6 text-sm text-red-100">Close your registered business</p>
            <span className="rounded-lg bg-white px-6 py-2 font-semibold text-red-600 transition-colors hover:bg-red-50">
              File Closure
            </span>
          </div>
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">My Applications</h2>

        {applications.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <FileText className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900">No applications yet</h3>
            <p className="text-gray-600">Start by selecting an application type above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 rounded-lg bg-white shadow">
            {applications.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-4 transition-colors hover:bg-gray-50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium text-gray-700">
                      {app.applicationNumber}
                    </span>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="font-medium text-gray-900">{app.businessName}</p>
                  <p className="text-sm text-gray-500">
                    {app.type} • {app.businessType} • Submitted{" "}
                    {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Link href={`/dashboard/applications/${app.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
