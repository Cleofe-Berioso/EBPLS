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
      <div className="space-y-6 text-slate-900">
        <header className="space-y-1 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em]">{certificate.heading.republic}</p>
          <p className="text-sm font-semibold uppercase tracking-[0.12em]">{certificate.heading.province}</p>
          <p className="text-sm font-semibold uppercase tracking-[0.12em]">{certificate.heading.municipality}</p>
          <p className="text-base font-semibold uppercase tracking-[0.12em]">{certificate.heading.office}</p>
          <h2 className="pt-2 text-2xl font-bold uppercase tracking-[0.16em]">{certificate.heading.title}</h2>
        </header>

        <section className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
          <p className="text-sm"><span className="font-semibold">Certificate Number:</span> {certificate.certificateNumber}</p>
          <p className="text-sm"><span className="font-semibold">Application Number:</span> {certificate.applicationNumber}</p>
          <p className="text-sm"><span className="font-semibold">Date Issued:</span> {dateLabel(certificate.dateIssued)}</p>
          <p className="text-sm"><span className="font-semibold">Effective Date of Closure:</span> {dateLabel(certificate.effectiveClosureDate)}</p>
        </section>

        <section className="rounded-xl border border-slate-200 p-4">
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

        <section className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900">Certification Statement</p>
          <p className="mt-2 text-sm leading-6 text-blue-900">{certificate.certificationStatement}</p>
        </section>

        <section className="rounded-xl border border-dashed border-slate-300 p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">Verification</p>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center border border-slate-300 bg-slate-100 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
              QR
            </div>
            <p className="text-sm text-slate-700">{certificate.verificationPlaceholder}</p>
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
