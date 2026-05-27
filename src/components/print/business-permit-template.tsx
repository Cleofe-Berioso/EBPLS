"use client";

import Image from "next/image";
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

function moneyLabel(value: number): string {
  return `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function DetailRow({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="grid grid-cols-[170px_1fr] gap-3 border-b border-black/30 py-2 text-[13px] leading-tight sm:grid-cols-[190px_1fr]">
      <p className="font-semibold text-black">{label}</p>
      <p className={multiline ? "whitespace-pre-line font-semibold text-black" : "font-semibold text-black"}>{value || "-"}</p>
    </div>
  );
}

function SignatureBlock() {
  return (
    <div className="pt-4 text-center text-black">
      <div className="mx-auto h-12 w-full max-w-[220px] border-b border-black" />
      <p className="mt-2 text-[14px] font-bold uppercase tracking-wide">MUNICIPAL MAYOR</p>
    </div>
  );
}

export function BusinessPermitTemplate({ permit, variant = "official" }: BusinessPermitTemplateProps) {
  const applicantPreview = variant === "applicant-preview";

  return (
    <section className="mx-auto w-full max-w-[820px] bg-white px-3 py-4 text-black sm:px-4 print:max-w-none print:px-0 print:py-0">
      <div className="no-print mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {applicantPreview ? "Applicant permit preview only. Official printing and release remain under BPLO." : "Official permit print preview."}
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded border border-black px-3 py-1.5 text-sm font-semibold text-black"
        >
          Print / Save as PDF
        </button>
      </div>

      <article className="relative overflow-hidden border-[3px] border-black bg-white px-4 py-4 sm:px-6 sm:py-5 print:border-[2px]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
          <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black" />
          <div className="absolute left-1/2 top-1/2 flex h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-black/60 bg-white/20">
            <Image src="/images/logo.png" alt="Municipal seal watermark" width={220} height={220} className="h-[220px] w-[220px] object-contain" />
          </div>
        </div>

        <header className="relative z-10">
          <div className="grid grid-cols-[76px_1fr_76px] items-start gap-3 sm:grid-cols-[90px_1fr_90px]">
            <div className="flex justify-start">
              <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full border border-black bg-white p-1 sm:h-[86px] sm:w-[86px]">
                <Image src="/images/logo.png" alt="Municipality seal" width={78} height={78} className="h-full w-full object-contain" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-[12px] font-semibold uppercase leading-tight sm:text-[13px]">{permit.heading.republic}</p>
              <p className="text-[12px] font-semibold uppercase leading-tight sm:text-[13px]">{permit.heading.province}</p>
              <p className="text-[14px] font-bold uppercase leading-tight sm:text-[15px]">{permit.heading.municipality}</p>
              <p className="text-[12px] font-semibold uppercase leading-tight sm:text-[13px]">Office of the Municipal Mayor</p>
            </div>

            <div />
          </div>

          <div className="mt-4 border-[3px] border-black px-3 py-2 text-center sm:px-4 sm:py-3">
            <h1 className="text-[24px] font-extrabold tracking-[0.02em] text-[#b11d1d] sm:text-[30px]">
              {permit.heading.title}
            </h1>
          </div>
        </header>

        <section className="relative z-10 mt-4 grid gap-0 border-t border-black text-[13px]">
          <div className="grid grid-cols-1 gap-0 border-b border-black/60 sm:grid-cols-3">
            <div className="border-b border-black/60 px-3 py-2 sm:border-b-0 sm:border-r sm:border-black/60">
              <p className="text-[11px] font-semibold uppercase">Permit No.</p>
              <p className="mt-1 text-[16px] font-bold">{permit.permitNumber}</p>
            </div>
            <div className="border-b border-black/60 px-3 py-2 sm:border-b-0 sm:border-r sm:border-black/60">
              <p className="text-[11px] font-semibold uppercase">Application No.</p>
              <p className="mt-1 text-[16px] font-bold">{permit.applicationNumber}</p>
            </div>
            <div className="px-3 py-2">
              <p className="text-[11px] font-semibold uppercase">Permit Year</p>
              <p className="mt-1 text-[16px] font-bold">{permit.taxYear}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-0 border-b border-black/60 sm:grid-cols-3">
            <div className="border-b border-black/60 px-3 py-2 sm:border-b-0 sm:border-r sm:border-black/60">
              <p className="text-[11px] font-semibold uppercase">Date Issued</p>
              <p className="mt-1 text-[14px] font-bold">{dateLabel(permit.dateIssued)}</p>
            </div>
            <div className="border-b border-black/60 px-3 py-2 sm:border-b-0 sm:border-r sm:border-black/60">
              <p className="text-[11px] font-semibold uppercase">Expiry Date</p>
              <p className="mt-1 text-[14px] font-bold">{dateLabel(permit.validUntil)}</p>
            </div>
            <div className="px-3 py-2">
              <p className="text-[11px] font-semibold uppercase">Classification</p>
              <p className="mt-1 text-[14px] font-bold">{permit.classification}</p>
            </div>
          </div>
        </section>

        <section className="relative z-10 mt-3 text-[13px]">
          <DetailRow label="Business Trade Name:" value={permit.tradeName || permit.businessName} />
          <DetailRow label="Owner/Applicant:" value={permit.ownerOrPresident} />
          <DetailRow label="Business Address:" value={permit.businessAddress} multiline />
          <DetailRow label="Line of Business:" value={permit.natureOfBusiness} />
          <DetailRow label="Business Activity:" value={permit.businessActivity} />
        </section>

        <section className="relative z-10 mt-4 rounded border border-black px-4 py-3 text-[13px] leading-relaxed">
          <p className="text-justify font-medium">
            THIS CERTIFIES that the above-named business is hereby granted permission to operate within the Municipality of E.B. Magalona,
            Province of Negros Occidental, subject to the provisions of existing laws, ordinances, rules and regulations, and other
            issuances of this Municipality.
          </p>
        </section>

        <section className="relative z-10 mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            <div className="rounded border border-black px-3 py-3 text-[13px]">
              <p className="border-b border-black pb-1 text-[13px] font-bold uppercase tracking-wide">Payment Information</p>
              <div className="mt-2 space-y-1.5">
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <span className="font-semibold">Official Receipt Number:</span>
                  <span className="font-bold">{permit.orNumber}</span>
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <span className="font-semibold">Date:</span>
                  <span className="font-bold">{dateLabel(permit.datePaid)}</span>
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <span className="font-semibold">Amount Paid:</span>
                  <span className="font-bold">{permit.amountPaid > 0 ? moneyLabel(permit.amountPaid) : "-"}</span>
                </div>
              </div>
            </div>

            <div className="rounded border-2 border-black px-3 py-3 text-center text-[15px] font-extrabold uppercase leading-tight">
              Erasure and/or alteration will invalidate this permit
            </div>
          </div>

          <div className="rounded border border-black px-3 py-3">
            <p className="text-[13px] font-bold uppercase">Approved:</p>
            <div className="flex min-h-[150px] items-end justify-center pb-2 sm:min-h-[170px]">
              <SignatureBlock />
            </div>
          </div>
        </section>

        <footer className="relative z-10 mt-4 border-t border-black pt-3 text-center text-[12px] leading-snug">
          <p>
            This permit shall be posted conspicuously at the place of business indicated herein and is <span className="font-bold uppercase">not transferable</span> to any other person, firm, or entity.
          </p>
          <p className="mt-1 text-[11px] font-medium">{permit.legalNote}</p>
        </footer>
      </article>
    </section>
  );
}
