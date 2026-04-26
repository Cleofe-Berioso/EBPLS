import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getPaymentStatus(status: string) {
  switch (status) {
    case "PAID":
      return { text: "Paid", color: "bg-green-100 text-green-800" };
    case "PENDING":
      return { text: "Pending", color: "bg-yellow-100 text-yellow-800" };
    case "FAILED":
      return { text: "Failed", color: "bg-red-100 text-red-800" };
    default:
      return { text: "Unknown", color: "bg-gray-100 text-gray-800" };
  }
}

export default async function ApprovedApplicationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status !== "ACTIVE") {
    redirect("/dashboard");
  }

  if (session.user.role !== "BPLO_OFFICE") {
    redirect("/dashboard");
  }

  const approvedApps = await prisma.application.findMany({
    where: {
      applicationApproved: true,
      status: "PAID",
      permit: null,
    },
    include: {
      applicant: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      payments: {
        where: {
          status: "PAID",
        },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Approved Applications
          </h1>
          <p className="text-[var(--text-secondary)]">
            Applications ready for permit issuance
          </p>
        </div>
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold">
          {approvedApps.length} Ready
        </div>
      </div>

      {approvedApps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-[var(--text-muted)] mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              No Approved Applications
            </h3>
            <p className="text-[var(--text-secondary)] text-center max-w-md">
              There are currently no approved applications waiting for permit
              issuance.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Applications Ready for Issuance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-sm font-semibold text-[var(--text-primary)]">
                    <th className="text-left py-3 px-4">App #</th>
                    <th className="text-left py-3 px-4">Business</th>
                    <th className="text-left py-3 px-4">Applicant</th>
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4">Payment</th>
                    <th className="text-left py-3 px-4">Approved</th>
                    <th className="text-left py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedApps.map((app, idx) => {
                    const paymentStatus =
                      app.payments.length > 0 ? "PAID" : "PENDING";
                    const paymentInfo = getPaymentStatus(paymentStatus);

                    return (
                      <tr
                        key={app.id}
                        className={`border-b ${
                          idx % 2 === 0 ? "bg-[var(--bg-secondary)]" : ""
                        } hover:bg-[var(--bg-hover)] transition-colors text-sm`}
                      >
                        <td className="py-3 px-4 font-medium">
                          {app.applicationNumber}
                        </td>
                        <td className="py-3 px-4">{app.businessName}</td>
                        <td className="py-3 px-4">
                          {app.applicant?.firstName ?? "N/A"} {app.applicant?.lastName ?? "N/A"}
                        </td>
                        <td className="py-3 px-4 capitalize">
                          {(app.type || "new").toLowerCase()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${paymentInfo.color}`}
                          >
                            {paymentInfo.text}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {formatDate(app.updatedAt)}
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/dashboard/issuance?appId=${app.id}`}>
                            <Button variant="outline" size="sm">
                              Issue
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
