import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

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

export default async function PaymentReportsPage() {
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

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const allPayments = await prisma.payment.findMany({
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    include: {
      application: {
        select: {
          applicationNumber: true,
          businessName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const methodBreakdown = await prisma.payment.groupBy({
    by: ["method"],
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  const totalRevenue = allPayments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );
  const completedCount = allPayments.filter(
    (p) => p.status === "PAID"
  ).length;
  const completedAmount = allPayments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const pendingAmount = allPayments
    .filter((p) => p.status === "PENDING" || p.status === "PROCESSING")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const failedAmount = allPayments
    .filter((p) => p.status === "FAILED")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const averagePayment = completedCount > 0 ? completedAmount / completedCount : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Payment Reports
        </h1>
        <p className="text-[var(--text-secondary)]">
          Payment analytics and revenue insights (Last 30 days)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              All transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              {formatCurrency(completedAmount)}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              {completedCount} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">
              {formatCurrency(pendingAmount)}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Awaiting validation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Average Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              {formatCurrency(averagePayment)}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {methodBreakdown.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-[var(--text-muted)]" />
                <p className="text-[var(--text-secondary)] ml-4">
                  No payment data available
                </p>
              </div>
            ) : (
              methodBreakdown.map((method) => {
                const amount = Number(method._sum?.amount) || 0;
                const count = method._count?.id || 0;
                const percentage = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;

                return (
                  <div key={method.method}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold capitalize">
                          {(method.method || "unknown").toLowerCase()}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {count} transaction{count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <p className="font-bold">{formatCurrency(amount)}</p>
                    </div>
                    <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2">
                      <div
                        className="bg-[var(--accent)] h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {percentage.toFixed(1)}% of total
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm font-semibold text-[var(--text-primary)]">
                  <th className="text-left py-3 px-4">Application</th>
                  <th className="text-left py-3 px-4">Business</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Method</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {allPayments.slice(0, 10).map((payment, idx) => (
                  <tr
                    key={payment.id}
                    className={`border-b ${
                      idx % 2 === 0 ? "bg-[var(--bg-secondary)]" : ""
                    } hover:bg-[var(--bg-hover)] transition-colors text-sm`}
                  >
                    <td className="py-3 px-4 font-medium">
                      {payment.application?.applicationNumber ?? "N/A"}
                    </td>
                    <td className="py-3 px-4">{payment.application?.businessName ?? "N/A"}</td>
                    <td className="py-3 px-4 font-semibold">
                      {formatCurrency(Number(payment.amount))}
                    </td>
                    <td className="py-3 px-4 capitalize">
                      {(payment.method || "unknown").toLowerCase()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          payment.status === "PAID"
                            ? "bg-green-100 text-green-800"
                            : payment.status === "PENDING" ||
                              payment.status === "PROCESSING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{formatDate(payment.createdAt)}</td>
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
