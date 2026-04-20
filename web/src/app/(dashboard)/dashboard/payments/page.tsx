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

function getStatusBadgeColor(status: string) {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-800";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "FAILED":
      return "bg-red-100 text-red-800";
    case "PROCESSING":
      return "bg-blue-100 text-blue-800";
    case "REFUNDED":
      return "bg-purple-100 text-purple-800";
    case "CANCELLED":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default async function PaymentsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status !== "ACTIVE") {
    redirect("/dashboard");
  }

  if (session.user.role !== "APPLICANT") {
    redirect("/dashboard");
  }

  const payments = await prisma.payment.findMany({
    where: {
      application: {
        applicantId: session.user.id,
      },
    },
    include: {
      application: {
        select: {
          id: true,
          applicationNumber: true,
          businessName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Payment History
        </h1>
        <p className="text-[var(--text-secondary)]">
          View all your permit application payments
        </p>
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-[var(--text-muted)] mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              No Payments Yet
            </h3>
            <p className="text-[var(--text-secondary)] text-center max-w-md">
              You don't have any payment records. When you submit an application
              and make a payment, it will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Payment Records</CardTitle>
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
                  {payments.map((payment, idx) => (
                    <tr
                      key={payment.id}
                      className={`border-b ${
                        idx % 2 === 0 ? "bg-[var(--bg-secondary)]" : ""
                      } hover:bg-[var(--bg-hover)] transition-colors text-sm`}
                    >
                      <td className="py-3 px-4 font-medium">
                        {payment.application?.applicationNumber ?? "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        {payment.application?.businessName ?? "N/A"}
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        {formatCurrency(Number(payment.amount) || 0)}
                      </td>
                      <td className="py-3 px-4 capitalize">
                        {(payment.method || "unknown").toLowerCase()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeColor(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {formatDate(payment.createdAt)}
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
