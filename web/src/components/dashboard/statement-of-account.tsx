"use client";

import { useEffect, useState } from "react";
import { DollarSign, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Payment {
  id: string;
  referenceNumber: string | null;
  amount: number | null;
  method: string;
  status: string;
  receiptNumber: string | null;
  paidAt: string | null;
  createdAt: string;
  metadata?: {
    permitFee?: string;
    processingFee?: string;
    filingFee?: string;
    businessName?: string;
    applicationType?: string;
  } | null;
}

function fmt(n: number | string | null | undefined) {
  if (n === null || n === undefined) return "₱0.00";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(n));
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  PAID: <CheckCircle className="h-4 w-4 text-green-600" />,
  PENDING: <Clock className="h-4 w-4 text-yellow-500" />,
  PROCESSING: <Clock className="h-4 w-4 text-blue-500" />,
  FAILED: <AlertCircle className="h-4 w-4 text-red-500" />,
};

const STATUS_BADGE: Record<string, string> = {
  PAID: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-purple-100 text-purple-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

export default function StatementOfAccount({
  applicationId,
  initialPayments = [],
}: {
  applicationId: string;
  initialPayments?: Payment[];
}) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [loading, setLoading] = useState(initialPayments.length === 0);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/payments?applicationId=${applicationId}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => {
        const nextPayments = d.payments ?? [];
        setPayments(nextPayments.length > 0 ? nextPayments : initialPayments);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError("Failed to load payment details");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [applicationId, initialPayments]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 p-4">
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <DollarSign className="h-10 w-10 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">No payment records for this application.</p>
      </div>
    );
  }

  const latest = payments[0];
  const meta = latest.metadata;
  const totalDue = latest.amount ?? 0;
  const isPaid = latest.status === "PAID";

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div
        className={`flex items-center gap-3 rounded-lg p-3 ${
          isPaid ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"
        }`}
      >
        {STATUS_ICON[latest.status] ?? <Clock className="h-4 w-4 text-gray-400" />}
        <div>
          <p className={`text-sm font-semibold ${isPaid ? "text-green-800" : "text-yellow-800"}`}>
            {isPaid ? "Payment Confirmed" : `Payment ${latest.status.toLowerCase()}`}
          </p>
          {latest.receiptNumber && (
            <p className="text-xs text-gray-600">Receipt: {latest.receiptNumber}</p>
          )}
          {latest.referenceNumber && (
            <p className="text-xs text-gray-600">Ref: {latest.referenceNumber}</p>
          )}
        </div>
        {isPaid && latest.paidAt && (
          <p className="ml-auto text-xs text-gray-500">{fmtDate(latest.paidAt)}</p>
        )}
      </div>

      {/* Fee Breakdown */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700">Statement of Account</h4>
        </div>
        <div className="divide-y divide-gray-100">
          {meta?.permitFee && (
            <FeeRow label="Permit Fee" amount={meta.permitFee} />
          )}
          {meta?.processingFee && (
            <FeeRow label="Processing Fee" amount={meta.processingFee} />
          )}
          {meta?.filingFee && (
            <FeeRow label="Filing Fee" amount={meta.filingFee} />
          )}
          {!meta?.permitFee && !meta?.processingFee && !meta?.filingFee && (
            <div className="px-4 py-3 text-sm text-gray-500">
              Fee breakdown not available
            </div>
          )}
          <div className="flex justify-between px-4 py-3 bg-gray-50">
            <span className="text-sm font-semibold text-gray-900">Total Amount</span>
            <span className="text-sm font-bold text-gray-900">{fmt(totalDue)}</span>
          </div>
        </div>
      </div>

      {/* Method */}
      <div className="flex justify-between text-sm text-gray-600">
        <span>Payment Method</span>
        <span className="font-medium capitalize">{latest.method.toLowerCase().replace(/_/g, " ")}</span>
      </div>

      {/* History if multiple payments */}
      {payments.length > 1 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Payment History</h4>
          {payments.map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded bg-gray-50 px-3 py-2 text-xs">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                  STATUS_BADGE[p.status] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {STATUS_ICON[p.status]}
                {p.status}
              </span>
              <span className="text-gray-600">{fmt(p.amount)}</span>
              <span className="text-gray-500 ml-auto">{fmtDate(p.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeeRow({ label, amount }: { label: string; amount: string | number }) {
  return (
    <div className="flex justify-between px-4 py-2.5 text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{fmt(amount)}</span>
    </div>
  );
}
