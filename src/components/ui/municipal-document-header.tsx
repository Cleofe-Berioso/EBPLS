import Image from "next/image";
import type { ReactNode } from "react";
import { EBPLS_REPORT_HEADING } from "@/lib/printable-reports";

export type MunicipalDocumentHeading = {
  republic?: string;
  province?: string;
  municipality?: string;
  office?: string;
  title: string;
};

/**
 * Official municipal heading used on the Business Permit print layout.
 * Reused for IT Dashboard / Reports so IT Administrator screens share the same document identity.
 */
export function MunicipalDocumentHeader({
  heading,
  subtitle,
  meta,
  actions,
  titleTone = "official",
}: {
  heading: MunicipalDocumentHeading;
  subtitle?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  titleTone?: "official" | "neutral";
}) {
  const republic = heading.republic ?? EBPLS_REPORT_HEADING.republic;
  const province = heading.province ?? EBPLS_REPORT_HEADING.province;
  const municipality = heading.municipality ?? EBPLS_REPORT_HEADING.municipality;
  const office = heading.office ?? EBPLS_REPORT_HEADING.office;
  const titleClass =
    titleTone === "official"
      ? "text-[1.35rem] font-black tracking-[0.01em] text-[#bf1d18] sm:text-[1.75rem]"
      : "text-[1.35rem] font-black tracking-[0.01em] text-[var(--foreground)] sm:text-[1.75rem]";

  return (
    <header className="app-surface relative overflow-hidden px-4 py-5 sm:px-6 sm:py-6">
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--border-color)]" />
      </div>

      {actions ? (
        <div className="relative z-[1] mb-4 flex flex-wrap items-center justify-end gap-2 no-print">{actions}</div>
      ) : null}

      <div className="relative z-[1] grid grid-cols-[64px_1fr_64px] items-start gap-3 sm:grid-cols-[88px_1fr_88px]">
        <div className="flex justify-start">
          <div className="flex h-14 w-14 items-center justify-center bg-white sm:h-[76px] sm:w-[76px]">
            <Image
              src="/images/logo.png"
              alt="Municipality seal"
              width={76}
              height={76}
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        <div className="text-center">
          <p className="text-[11px] font-medium leading-tight text-[var(--foreground)] sm:text-[13px]">{republic}</p>
          <p className="mt-0.5 text-[11px] font-medium leading-tight text-[var(--foreground)] sm:text-[13px]">{province}</p>
          <p className="mt-1.5 text-[1.15rem] font-black uppercase leading-none tracking-[0.02em] text-[var(--foreground)] sm:text-[1.55rem]">
            {municipality}
          </p>
          <p className="mt-1.5 text-[0.8rem] font-extrabold uppercase leading-tight tracking-[0.08em] text-[var(--foreground)] sm:text-[0.95rem]">
            {office}
          </p>
        </div>

        <div />
      </div>

      <div className="relative z-[1] mt-4 border-2 border-[var(--border-color)] bg-[var(--surface)] px-4 py-3 text-center">
        <h1 className={titleClass}>{heading.title}</h1>
        {subtitle ? (
          <p className="mx-auto mt-2 max-w-3xl text-sm leading-6 text-[var(--ink-muted)]">{subtitle}</p>
        ) : null}
        {meta ? <div className="mt-3 text-xs text-[var(--ink-muted)]">{meta}</div> : null}
      </div>
    </header>
  );
}

export const IT_DEPARTMENT_HEADING = {
  republic: EBPLS_REPORT_HEADING.republic,
  province: EBPLS_REPORT_HEADING.province,
  municipality: EBPLS_REPORT_HEADING.municipality,
  office: "Information Technology Division — System Administration",
} as const;
