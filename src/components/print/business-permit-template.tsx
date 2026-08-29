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
    day: "2-digit",
  });
}

function moneyLabel(value: number): string {
  return `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function printDateLabel(): string {
  return new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}

function displayText(value: string | null | undefined): string {
  if (!value) return "";
  return value === "—" ? "" : value;
}

function InlineUnderlinedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-end gap-2 text-[14px]">
      <p className="whitespace-nowrap font-semibold">{label}</p>
      <p className="min-h-[24px] flex-1 border-b border-black pb-0.5 font-bold">{value || "-"}</p>
    </div>
  );
}

export function BusinessPermitTemplate({ permit, variant = "official" }: BusinessPermitTemplateProps) {
  const applicantPreview = variant === "applicant-preview";
  const lineOfBusiness = displayText(permit.lineOfBusiness || permit.natureOfBusiness || permit.businessActivity).trim();
  const lineOfBusinessLabel = lineOfBusiness ? lineOfBusiness.toUpperCase() : "LINE OF BUSINESS NOT SPECIFIED";

  return (
    <section className="mx-auto w-full max-w-[860px] bg-white px-3 py-4 text-black sm:px-4 print:max-w-none print:px-0 print:py-0">
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

      <article className="relative overflow-hidden rounded-[26px] border border-slate-300 bg-white px-7 py-5 shadow-[0_0_40px_rgba(15,23,42,0.06)] print:rounded-none print:shadow-none sm:px-9 sm:py-6">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
          <div className="absolute left-1/2 top-[54%] h-[580px] w-[580px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-500" />
          <div className="absolute left-1/2 top-[54%] flex h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-400/60 bg-white/10">
            <Image src="/images/logo.png" alt="Municipal seal watermark" width={360} height={360} className="h-[360px] w-[360px] object-contain" />
          </div>
        </div>

        <header className="relative z-10">
          <div className="grid grid-cols-[82px_1fr_82px] items-start gap-3 sm:grid-cols-[100px_1fr_100px]">
            <div className="flex justify-start">
              <div className="flex h-[76px] w-[76px] items-center justify-center bg-white sm:h-[88px] sm:w-[88px]">
                <Image src="/images/logo.png" alt="Municipality seal" width={84} height={84} className="h-full w-full object-contain" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-[12px] font-medium leading-tight sm:text-[14px]">{permit.heading.republic}</p>
              <p className="mt-1 text-[12px] font-medium leading-tight sm:text-[14px]">{permit.heading.province}</p>
              <p className="mt-2 text-[24px] font-black uppercase leading-none tracking-[0.02em] sm:text-[34px]">{permit.heading.municipality}</p>
              <p className="mt-2 text-[16px] font-extrabold uppercase leading-tight tracking-[0.08em]">{permit.heading.office}</p>
            </div>

            <div />
          </div>

          <div className="mt-5 border-[2px] border-slate-200 px-4 py-3 text-center">
            <h1 className="text-[28px] font-black tracking-[0.01em] text-[#bf1d18] sm:text-[32px]">
              {permit.heading.title}
            </h1>
          </div>
        </header>

        <section className="relative z-10 mt-6 text-[13px] text-slate-950">
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 border-b border-slate-200 pb-4 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-[13px]">Date Issued:</p>
              <p className="text-[17px] font-bold leading-tight">{dateLabel(permit.dateIssued)}</p>
            </div>
            <div className="text-center">
              <p className="text-[13px]">Mayor&apos;s Permit No.:</p>
              <p className="text-[17px] font-bold leading-tight">{permit.permitNumber}</p>
            </div>
            <div className="text-center">
              <p className="text-[13px]">Permit Year:</p>
              <p className="text-[17px] font-bold leading-tight">{permit.taxYear}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-4 gap-y-3 border-b border-slate-200 py-4 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-[13px]">Permit Expires:</p>
              <p className="text-[17px] font-bold leading-tight">{dateLabel(permit.validUntil)}</p>
            </div>
            <div />
            <div className="text-center">
              <p className="text-[13px]">Classification:</p>
              <p className="text-[17px] font-bold leading-tight">{permit.classification}</p>
            </div>
          </div>
        </section>

        <section className="relative z-10 mt-5 space-y-4 text-[14px]">
          <p className="text-[28px] font-black leading-none sm:text-[30px]">This CERTIFIES that</p>
          <InlineUnderlinedField label="Business Name:" value={permit.businessName || permit.tradeName} />
          <InlineUnderlinedField label="Owner/Applicant Name:" value={permit.ownerOrPresident} />
          <InlineUnderlinedField label="Business Address:" value={permit.businessAddress} />

          <p className="pt-1 text-justify leading-relaxed">
            has been granted a <span className="font-extrabold uppercase">BUSINESS PERMIT</span> to operate the following business/activity subject to existing laws,
            ordinances, rules and regulations of the Municipality of {permit.municipalityNameForBody} and to the pertinent provisions of
            Republic Act 7160 otherwise known as the Local Government Code of 1991. Conditions stipulated in the application must be
            complied with, and any infraction or violation may be sufficient ground for the revocation of the <span className="font-extrabold uppercase">PERMIT</span>.
          </p>
        </section>

        <section className="relative z-10 mt-8 rounded-none border-[2px] border-slate-200 px-4 py-7 text-center">
          <p className="text-[24px] font-black uppercase leading-tight sm:text-[28px]">{lineOfBusinessLabel}</p>
          <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.08em] text-slate-700">Line of Business</p>
        </section>

        <section className="relative z-10 mt-10 grid min-h-[122px] grid-cols-[1fr_auto] items-end gap-6">
          <div className="flex min-h-[88px] items-end">
            <div className="text-[12px] text-slate-700">
              <p>Generated by Business Permit Online System</p>
              <p>Date Printed: {printDateLabel()}</p>
              <p>{permit.legalNote}</p>
            </div>
          </div>

          <div className="w-full max-w-[238px] text-center">
            <div className="h-8 border-b border-black" />
            <p className="mt-2 text-[16px] font-extrabold sm:text-[18px]">{permit.municipalMayorName}</p>
            <p className="text-[14px]">Municipal Mayor</p>
          </div>
        </section>
      </article>
    </section>
  );
}
