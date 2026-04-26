"use client";

import { useState } from "react";
import { Shield, Search, CheckCircle, XCircle, QrCode, Loader2, Calendar, Building2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PublicNav } from "@/components/public/public-nav";
import { PublicFooter } from "@/components/public/public-footer";

interface PermitInfo {
  permitNumber: string;
  businessName: string;
  businessAddress: string;
  ownerName: string;
  issueDate: string;
  expiryDate: string;
  status: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  ACTIVE:   { color: "text-[var(--success)] bg-green-100 border-green-200",  icon: <CheckCircle className="h-5 w-5 text-[var(--success)]" />, label: "Valid / Active" },
  EXPIRED:  { color: "text-[var(--danger)] bg-red-100 border-red-200",        icon: <XCircle className="h-5 w-5 text-[var(--danger)]" />,      label: "Expired" },
  REVOKED:  { color: "text-[var(--danger)] bg-red-100 border-red-200",        icon: <XCircle className="h-5 w-5 text-[var(--danger)]" />,      label: "Revoked" },
  RENEWED:  { color: "text-[var(--text-primary)] bg-[var(--surface-muted)] border-[var(--border)]",     icon: <XCircle className="h-5 w-5 text-[var(--text-secondary)]" />,     label: "Superseded (Renewed)" },
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

export default function VerifyPermitPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [permit, setPermit] = useState<PermitInfo | null>(null);
  const [error, setError] = useState("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const val = query.trim().toUpperCase();
    if (!val) return;
    setLoading(true);
    setError("");
    setPermit(null);
    try {
      const res = await fetch(`/api/public/verify-permit?number=${encodeURIComponent(val)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Permit not found"); return; }
      setPermit(data.permit);
    } finally {
      setLoading(false);
    }
  }

  const cfg = permit ? (STATUS_CONFIG[permit.status] ?? STATUS_CONFIG.EXPIRED) : null;
  const isValid = permit?.status === "ACTIVE";
  return (
    <div className="min-h-screen bg-[var(--surface-muted)] flex flex-col">
      <PublicNav />

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
        {/* Back link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
        </Link>

        {/* Header */}
        <div className="mb-8 text-center">
          <QrCode className="mx-auto mb-3 h-12 w-12 text-blue-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Verify Business Permit</h1>
          <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)]">
            Enter the permit number (e.g.{" "}
            <code className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-sm">BP-2026-000001</code>
            ) to verify its authenticity.
          </p>
        </div>

        {/* Verify Form */}
        <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. BP-2026-000001"
            className="flex-1 rounded-lg border border-[var(--border)] px-4 py-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[var(--accent)] placeholder:normal-case"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-60 whitespace-nowrap"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Verify Permit          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-200 bg-[var(--danger-light)] p-4">
            <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">Permit Not Found</p>
              <p className="text-sm text-[var(--danger)]">{error}</p>
            </div>          </div>
        )}

        {permit && cfg && (
          <div className={`mt-6 rounded-xl border-2 p-6 ${isValid ? "border-green-200 bg-[var(--success-light)]" : "border-red-200 bg-[var(--danger-light)]"}`}>
            {/* Status Banner */}
            <div className={`mb-5 flex items-center gap-3 rounded-lg border px-4 py-3 ${cfg.color}`}>
              {cfg.icon}
              <div>
                <p className="font-semibold">{cfg.label}</p>
                <p className="text-xs opacity-80">Permit #{permit.permitNumber}</p>
              </div>
            </div>

            {/* Permit Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-5 w-5 text-[var(--text-muted)] flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium uppercase text-[var(--text-secondary)]">Business Name</p>
                  <p className="font-semibold text-[var(--text-primary)]">{permit.businessName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 text-[var(--text-muted)] flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium uppercase text-[var(--text-secondary)]">Owner / Registrant</p>
                  <p className="font-semibold text-[var(--text-primary)]">{permit.ownerName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:col-span-2">
                <Building2 className="mt-0.5 h-5 w-5 text-[var(--text-muted)] flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium uppercase text-[var(--text-secondary)]">Business Address</p>
                  <p className="text-[var(--text-primary)]">{permit.businessAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-[var(--text-muted)] flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium uppercase text-[var(--text-secondary)]">Date Issued</p>
                  <p className="text-[var(--text-primary)]">{fmt(permit.issueDate)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-[var(--text-muted)] flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium uppercase text-[var(--text-secondary)]">Valid Until</p>
                  <p className={`font-semibold ${isValid ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                    {fmt(permit.expiryDate)}
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-[var(--text-secondary)]">
              This verification is provided by the LGU Online Business Permit System.
              For concerns, contact the BPLO office.
            </p>          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 rounded-xl border bg-[var(--surface)] p-5 sm:p-6">
          <h3 className="mb-3 font-semibold text-[var(--text-primary)] text-sm">How to Verify a Permit</h3>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
            <li>Locate the permit number on the physical or digital business permit (format: <code className="rounded bg-[var(--surface-muted)] px-1">BP-YYYY-NNNNNN</code>).</li>
            <li>Enter the permit number in the field above and click <strong>Verify Permit</strong>.</li>
            <li>The system will display the permit status, business name, owner, and validity dates.</li>
            <li>A <span className="font-medium text-[var(--success)]">green</span> result means the permit is currently valid. A <span className="font-medium text-[var(--danger)]">red</span> result indicates it is expired, revoked, or superseded.</li>
          </ol>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
