"use client";

import type { ReactNode } from "react";

interface PrintPageShellProps {
  documentTitle: string;
  documentNumber?: string | null;
  issuedAtLabel?: string | null;
  onPrint?: () => void;
  children: ReactNode;
}

export function PrintPageShell({
  documentTitle,
  documentNumber,
  issuedAtLabel,
  onPrint,
  children,
}: PrintPageShellProps) {
  return (
    <section className="print-page-shell mx-auto max-w-[900px] space-y-4 p-4 sm:p-6">
      <div className="no-print flex items-center justify-end">
        <button
          type="button"
          onClick={onPrint ?? (() => window.print())}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Print Document
        </button>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-8 text-slate-900 shadow-sm print:border-0 print:shadow-none">
        <header className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold tracking-tight">{documentTitle}</h1>
          <div className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
            <p>
              Document No.: <span className="font-semibold text-slate-900">{documentNumber ?? "-"}</span>
            </p>
            <p>
              Issued: <span className="font-semibold text-slate-900">{issuedAtLabel ?? "-"}</span>
            </p>
          </div>
        </header>

        <div className="mt-6 space-y-4 leading-7">{children}</div>
      </article>

      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 12mm;
        }

        @media print {
          html,
          body {
            background: #ffffff !important;
          }

          .no-print,
          nav,
          aside,
          [data-app-chrome],
          [data-navigation],
          [data-sidebar] {
            display: none !important;
          }

          .print-page-shell {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-page-shell article {
            border: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </section>
  );
}
