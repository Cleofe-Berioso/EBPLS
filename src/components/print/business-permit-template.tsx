import { PrintPageShell } from "@/components/ui/print-page-shell";
import type { BusinessPermitPrintData } from "@/lib/printable-documents";

interface BusinessPermitTemplateProps {
  permit: BusinessPermitPrintData;
  variant?: "official" | "applicant-preview";
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

export function BusinessPermitTemplate({ permit, variant = "official" }: BusinessPermitTemplateProps) {
  const applicantPreview = variant === "applicant-preview";

  return (
    <PrintPageShell
      documentTitle="Business Permit"
      documentNumber={permit.permitNumber}
      issuedAtLabel={dateLabel(permit.dateIssued)}
      showPrintButton={!applicantPreview}
    >
      <div className="space-y-6 text-black">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase">{permit.heading.republic}</p>
          <p className="text-sm font-semibold uppercase">{permit.heading.province}</p>
          <p className="text-sm font-semibold uppercase">{permit.heading.municipality}</p>
          <p className="text-base font-semibold uppercase">{permit.heading.office}</p>
          <h2 className="pt-2 text-lg font-bold uppercase">{permit.heading.title}</h2>
        </header>

        <section className="grid gap-2" aria-label="Permit details">
          <p className="text-sm"><strong>Permit Number:</strong> {permit.permitNumber}</p>
          <p className="text-sm"><strong>Application Number:</strong> {permit.applicationNumber}</p>
          <p className="text-sm"><strong>Tax Year:</strong> {permit.taxYear}</p>
          <p className="text-sm"><strong>Date Issued:</strong> {dateLabel(permit.dateIssued)}</p>
          <p className="text-sm"><strong>Valid Until:</strong> {dateLabel(permit.validUntil)}</p>
        </section>

        <section>
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

        <section>
          <p className="text-sm font-semibold">Verification</p>
          <div className="mt-2 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center border border-black text-[10px] font-semibold">QR</div>
            <p className="text-sm">{permit.verificationPlaceholder}</p>
          </div>
        </section>

        <section className="grid gap-6 pt-4 md:grid-cols-3">
          <SignatoryBlock title={permit.signatories.bploOfficer} />
          <SignatoryBlock title={permit.signatories.municipalTreasurer} />
          <SignatoryBlock title={permit.signatories.mayor} />
        </section>

        <footer className="pt-4">
          <p className="text-sm italic">{permit.legalNote}</p>
        </footer>
      </div>
    </PrintPageShell>
  );
}
