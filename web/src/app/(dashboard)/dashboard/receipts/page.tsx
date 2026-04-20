import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";

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
  return "bg-green-100 text-green-800";
}

export default async function ReceiptsPage() {
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

  const completedPayments = await prisma.payment.findMany({
    where: {
      status: "PAID",
    },
    include: {
      application: {
        select: {
          applicationNumber: true,
          businessName: true,
          applicantId: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const totalCollected = completedPayments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Payment Receipts
        </h1>
        <p className="text-[var(--text-secondary)]">
          All completed and verified payments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              {completedPayments.length}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Issued receipts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(totalCollected)}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Amount collected
            </p>
          </CardContent>
        </Card>
      </div>

      {completedPayments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-[var(--text-muted)] mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              No Receipts Yet
            </h3>
            <p className="text-[var(--text-secondary)] text-center max-w-md">
              There are no completed payments with receipts yet. Payments will
              appear here once they are verified and completed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Receipt Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-sm font-semibold text-[var(--text-primary)]">
                    <th className="text-left py-3 px-4">Receipt ID</th>
                    <th className="text-left py-3 px-4">Application</th>
                    <th className="text-left py-3 px-4">Business</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Method</th>
                    <th className="text-left py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {completedPayments.map((payment, idx) => (
                    <tr
                      key={payment.id}
                      className={`border-b ${
                        idx % 2 === 0 ? "bg-[var(--bg-secondary)]" : ""
                      } hover:bg-[var(--bg-hover)] transition-colors text-sm`}
                    >
                      <td className="py-3 px-4 font-mono text-xs">
                        {payment.referenceNumber?.slice(0, 12) ??
                          `RCP-${payment.id.slice(0, 8).toUpperCase()}`}
                      </td>
                      <td className="py-3 px-4">
                        {payment.application?.applicationNumber ?? "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        {payment.application?.businessName ?? "N/A"}
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        {formatCurrency(Number(payment.amount))}
                      </td>
                      <td className="py-3 px-4 capitalize">
                        {(payment.method || "unknown").toLowerCase()}
                      </td>
                      <td className="py-3 px-4">
                        {formatDate(payment.updatedAt)}
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
