import { PrintPageShell } from "@/components/ui/print-page-shell";
import type { BusinessPermitPrintData } from "@/lib/printable-documents";

interface BusinessPermitTemplateProps {
  permit: BusinessPermitPrintData;
}

function dateLabel(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[210px_1fr] gap-2 border-b border-slate-200 py-2 text-sm">
      <p className="font-semibold text-slate-700">{label}</p>
      <p className="font-medium text-slate-900">{value || "-"}</p>
    </div>
  );
}

function SignatoryBlock({ title }: { title: string }) {
  return (
    <div className="pt-8 text-center">
      <div className="mx-auto w-full max-w-[220px] border-b border-slate-700" />
      <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-slate-700">{title}</p>
    </div>
  );
}

export function BusinessPermitTemplate({ permit }: BusinessPermitTemplateProps) {
  return (
    <PrintPageShell
      documentTitle="Business Permit"
      documentNumber={permit.permitNumber}
      issuedAtLabel={dateLabel(permit.dateIssued)}
    >
      <div className="space-y-6 text-slate-900">
        <header className="space-y-1 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em]">{permit.heading.republic}</p>
          <p className="text-sm font-semibold uppercase tracking-[0.12em]">{permit.heading.province}</p>
          <p className="text-sm font-semibold uppercase tracking-[0.12em]">{permit.heading.municipality}</p>
          <p className="text-base font-semibold uppercase tracking-[0.12em]">{permit.heading.office}</p>
          <h2 className="pt-2 text-2xl font-bold uppercase tracking-[0.16em]">{permit.heading.title}</h2>
        </header>

        <section className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
          <p className="text-sm"><span className="font-semibold">Permit Number:</span> {permit.permitNumber}</p>
          <p className="text-sm"><span className="font-semibold">Application Number:</span> {permit.applicationNumber}</p>
          <p className="text-sm"><span className="font-semibold">Tax Year:</span> {permit.taxYear}</p>
          <p className="text-sm"><span className="font-semibold">Date Issued:</span> {dateLabel(permit.dateIssued)}</p>
          <p className="text-sm md:col-span-2"><span className="font-semibold">Valid Until:</span> {dateLabel(permit.validUntil)}</p>
        </section>

        <section className="rounded-xl border border-slate-200 p-4">
          <InfoRow label="Business Name" value={permit.businessName} />
          <InfoRow label="Trade Name" value={permit.tradeName} />
          <InfoRow label="Owner / President" value={permit.ownerOrPresident} />
          <InfoRow label="Business Type" value={permit.businessType} />
          <InfoRow label="Registration Number" value={permit.registrationNumber} />
          <InfoRow label="TIN" value={permit.tin} />
          <InfoRow label="Business Location / Address" value={permit.businessAddress} />
          <InfoRow label="Nature / Line of Business" value={permit.natureOfBusiness} />
          <InfoRow label="TOP Number" value={permit.topNumber} />
          <InfoRow label="OR Number" value={permit.orNumber} />
          <InfoRow label="Date Paid" value={dateLabel(permit.datePaid)} />
          <InfoRow
            label="Amount Paid (Annual)"
            value={permit.annualAmountPaid > 0
              ? `₱${permit.annualAmountPaid.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "-"}
          />
        </section>

        <section className="rounded-xl border border-dashed border-slate-300 p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">Verification</p>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center border border-slate-300 bg-slate-100 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
              QR
            </div>
            <p className="text-sm text-slate-700">{permit.verificationPlaceholder}</p>
          </div>
        </section>

        <section className="grid gap-6 pt-4 md:grid-cols-3">
          <SignatoryBlock title={permit.signatories.bploOfficer} />
          <SignatoryBlock title={permit.signatories.municipalTreasurer} />
          <SignatoryBlock title={permit.signatories.mayor} />
        </section>

        <footer className="border-t border-slate-200 pt-4">
          <p className="text-sm font-semibold italic text-slate-700">{permit.legalNote}</p>
        </footer>
      </div>
    </PrintPageShell>
  );
}
