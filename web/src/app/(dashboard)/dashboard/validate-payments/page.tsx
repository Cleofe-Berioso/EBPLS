import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";
import { PaymentValidationActions } from "@/components/dashboard/payment-validation-actions";

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

export default async function ValidatePaymentsPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Payment Validation
        </h1>
        <p className="text-[var(--text-secondary)]">
          Review and validate pending payment submissions
        </p>
      </div>

      {pendingPayments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              All Payments Validated
            </h3>
            <p className="text-[var(--text-secondary)] text-center max-w-md">
              There are no pending payments awaiting validation. All payments
              have been processed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Pending Payments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] hover:border-[var(--accent)] cursor-pointer transition-colors"
                  >
                    <p className="font-semibold text-sm text-[var(--text-primary)]">
                      {payment.application?.applicationNumber ?? "N/A"}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {payment.application?.businessName ?? "N/A"}
                    </p>
                    <p className="text-sm font-bold text-[var(--accent)] mt-2">
                      {formatCurrency(Number(payment.amount) || 0)}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {formatDate(payment.createdAt)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Validation Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingPayments.slice(0, 1).map((payment) => (
                    <div key={payment.id} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-[var(--text-secondary)]">
                            Application #
                          </p>
                          <p className="font-semibold">
                            {payment.application?.applicationNumber ?? "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-[var(--text-secondary)]">
                            Business
                          </p>
                          <p className="font-semibold">
                            {payment.application?.businessName ?? "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-[var(--text-secondary)]">
                            Amount
                          </p>
                          <p className="font-semibold text-lg">
                            {formatCurrency(Number(payment.amount) || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-[var(--text-secondary)]">
                            Method
                          </p>
                          <p className="font-semibold capitalize">
                            {(payment.method || "unknown").toLowerCase()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-[var(--text-secondary)]">
                            Status
                          </p>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(
                              payment.status
                            )}`}
                          >
                            {payment.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-[var(--text-secondary)]">
                            Submitted
                          </p>
                          <p className="font-semibold">
                            {formatDate(payment.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Validation Required
                        </h4>
                        <p className="text-sm text-[var(--text-secondary)] mb-4">
                          Please verify the payment details and confirm the
                          receipt of funds before proceeding.
                        </p>
                        <PaymentValidationActions paymentId={payment.id} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
