import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number | null | undefined) {
  if (!amount) return "₱0.00";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(amount));
}

export default async function PaidApplicationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status !== "ACTIVE") {
    redirect("/dashboard");
  }

  if (session.user.role !== "MTO") {
    redirect("/dashboard");
  }

  const paidApplications = await prisma.application.findMany({
    where: {
      payments: {
        some: {
          status: "PAID",
        },
      },
    },
    include: {
      applicant: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      payments: {
        where: {
          status: "PAID",
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const totalAmount = paidApplications.reduce((sum: number, app) => {
    const appTotal = app.payments.reduce(
      (s: number, p) => s + (Number(p.amount) || 0),
      0
    );
    return sum + appTotal;
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Paid Applications
        </h1>
        <p className="text-[var(--text-secondary)]">
          Applications with confirmed payments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              {paidApplications.length}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              With confirmed payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(totalAmount)}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Collected amounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              {formatCurrency(
                paidApplications.length > 0
                  ? totalAmount / paidApplications.length
                  : 0
              )}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Per application
            </p>
          </CardContent>
        </Card>
      </div>

      {paidApplications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-[var(--text-muted)] mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              No Paid Applications
            </h3>
            <p className="text-[var(--text-secondary)] text-center max-w-md">
              There are no applications with confirmed payments yet. Paid
              applications will appear here once payments are verified.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-sm font-semibold text-[var(--text-primary)]">
                    <th className="text-left py-3 px-4">App #</th>
                    <th className="text-left py-3 px-4">Business</th>
                    <th className="text-left py-3 px-4">Applicant</th>
                    <th className="text-left py-3 px-4">Total Payment</th>
                    <th className="text-left py-3 px-4">Method</th>
                    <th className="text-left py-3 px-4">Paid Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paidApplications.map((app, idx) => {
                    const totalPaid = app.payments.reduce(
                      (sum, p) => sum + (Number(p.amount) || 0),
                      0
                    );
                    const lastPayment = app.payments[0];

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
                        <td className="py-3 px-4 font-semibold text-green-600">
                          {formatCurrency(totalPaid)}
                        </td>
                        <td className="py-3 px-4 capitalize">
                          {(lastPayment?.method || "unknown").toLowerCase()}
                        </td>
                        <td className="py-3 px-4">
                          {lastPayment
                            ? formatDate(lastPayment.updatedAt)
                            : "N/A"}
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
