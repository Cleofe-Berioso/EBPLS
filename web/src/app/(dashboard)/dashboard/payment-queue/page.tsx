import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

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

function getStatusColor(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "PROCESSING":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default async function PaymentQueuePage() {
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

  const pendingPayments = await prisma.payment.findMany({
    where: {
      status: {
        in: ["PENDING", "PROCESSING"],
      },
    },
    include: {
      application: {
        select: {
          id: true,
          applicationNumber: true,
          businessName: true,
          applicantId: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const totalAmount = pendingPayments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Payment Queue
        </h1>
        <p className="text-[var(--text-secondary)]">
          Payments awaiting validation and processing
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              {pendingPayments.length}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Awaiting validation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              {formatCurrency(totalAmount)}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              In pending payments
            </p>
          </CardContent>
        </Card>
      </div>

      {pendingPayments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-[var(--text-muted)] mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              No Pending Payments
            </h3>
            <p className="text-[var(--text-secondary)] text-center max-w-md">
              All payments have been processed. There are no pending payments in
              the queue.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-sm font-semibold text-[var(--text-primary)]">
                    <th className="text-left py-3 px-4">Transaction ID</th>
                    <th className="text-left py-3 px-4">Application</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Method</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Submitted</th>
                    <th className="text-left py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayments.map((payment, idx) => (
                    <tr
                      key={payment.id}
                      className={`border-b ${
                        idx % 2 === 0 ? "bg-[var(--bg-secondary)]" : ""
                      } hover:bg-[var(--bg-hover)] transition-colors text-sm`}
                    >
                      <td className="py-3 px-4 font-mono text-xs">
                        {payment.referenceNumber?.slice(0, 8) ?? payment.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-4">
                        {payment.application?.applicationNumber ?? "N/A"}
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        {formatCurrency(Number(payment.amount))}
                      </td>
                      <td className="py-3 px-4 capitalize">
                        {(payment.method || "unknown").toLowerCase()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/dashboard/validate-payments?paymentId=${payment.id}`}
                        >
                          <Button variant="outline" size="sm">
                            Validate
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
