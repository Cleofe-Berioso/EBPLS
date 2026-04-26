"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PaymentValidationActions({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<"VERIFY" | "REJECT" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(action: "VERIFY" | "REJECT") {
    setError(null);
    setLoadingAction(action);
    const receiptNumber =
      action === "VERIFY" ? window.prompt("Receipt number (optional)") || undefined : undefined;
    const notes =
      action === "REJECT" ? window.prompt("Reason for rejection") || "Rejected by BPLO office" : undefined;

    try {
      const response = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, action, receiptNumber, notes }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.message || "Payment update failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment update failed");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          type="button"
          className="flex-1 bg-green-600 hover:bg-green-700"
          disabled={loadingAction !== null}
          onClick={() => submit("VERIFY")}
        >
          {loadingAction === "VERIFY" ? "Confirming..." : "Confirm Payment"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={loadingAction !== null}
          onClick={() => submit("REJECT")}
        >
          {loadingAction === "REJECT" ? "Rejecting..." : "Reject"}
        </Button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
