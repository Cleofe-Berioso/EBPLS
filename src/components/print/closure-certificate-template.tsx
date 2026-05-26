import { PrintPageShell } from "@/components/ui/print-page-shell";
import type { ClosureCertificatePrintData } from "@/lib/printable-documents";

interface ClosureCertificateTemplateProps {
  certificate: ClosureCertificatePrintData;
}

function dateLabel(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function money(value: number): string {
  return `PHP ${value.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
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
      <div className="mx-auto w-full max-w-[260px] border-b border-slate-700" />
      <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-slate-700">{title}</p>
    </div>
  );
}

export function ClosureCertificateTemplate({ certificate }: ClosureCertificateTemplateProps) {
  return (
    <PrintPageShell
      documentTitle="Business Closure Certificate"
      documentNumber={certificate.certificateNumber}
      issuedAtLabel={dateLabel(certificate.dateIssued)}
    >
      <div className="space-y-6 text-black">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase">{certificate.heading.republic}</p>
          <p className="text-sm font-semibold uppercase">{certificate.heading.province}</p>
          <p className="text-sm font-semibold uppercase">{certificate.heading.municipality}</p>
          <p className="text-base font-semibold uppercase">{certificate.heading.office}</p>
          <h2 className="pt-2 text-lg font-bold uppercase">{certificate.heading.title}</h2>
        </header>

        <section aria-label="Certificate details">
          <p className="text-sm"><strong>Certificate Number:</strong> {certificate.certificateNumber}</p>
          <p className="text-sm"><strong>Application Number:</strong> {certificate.applicationNumber}</p>
          <p className="text-sm"><strong>Date Issued:</strong> {dateLabel(certificate.dateIssued)}</p>
          <p className="text-sm"><strong>Effective Date of Closure:</strong> {dateLabel(certificate.effectiveClosureDate)}</p>
        </section>

        <section>
          <InfoRow label="Business Name" value={certificate.businessName} />
          <InfoRow label="Trade Name" value={certificate.tradeName} />
          <InfoRow label="Owner / President" value={certificate.ownerOrPresident} />
          <InfoRow label="Business Type" value={certificate.businessType} />
          <InfoRow label="Registration Number" value={certificate.registrationNumber} />
          <InfoRow label="TIN" value={certificate.tin} />
          <InfoRow label="Business Address / Location" value={certificate.businessAddress} />
          <InfoRow label="Reason for Closure" value={certificate.reasonForClosure} />
          <InfoRow label="TOP Number" value={certificate.topNumber} />
          <InfoRow label="OR Number" value={certificate.orNumber} />
          <InfoRow label="Date Paid" value={dateLabel(certificate.datePaid)} />
          <InfoRow label="Closure Certificate Fee" value={money(certificate.closureCertificateFee)} />
          <InfoRow label="Payment Dues / Pending Fee" value={money(certificate.paymentDuesPendingFee)} />
          <InfoRow label="Total Paid" value={money(certificate.totalPaid)} />
        </section>

        <section>
          <p className="text-sm font-semibold">Certification Statement</p>
          <p className="mt-2 text-sm leading-6">{certificate.certificationStatement}</p>
        </section>

        <section>
          <p className="text-sm font-semibold">Verification</p>
          <div className="mt-2 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center border border-black text-[10px] font-semibold">QR</div>
            <p className="text-sm">{certificate.verificationPlaceholder}</p>
          </div>
        </section>

        <section className="grid gap-6 pt-4 md:grid-cols-2">
          <SignatoryBlock title={certificate.signatories.bploOfficer} />
          <SignatoryBlock title={certificate.signatories.municipalTreasurerOrAuthorizedOfficer} />
        </section>
      </div>
    </PrintPageShell>
  );
}
