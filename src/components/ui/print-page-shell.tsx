"use client";

import type { ReactNode } from "react";

interface PrintPageShellProps {
  documentTitle: string;
  documentNumber?: string | null;
  issuedAtLabel?: string | null;
  onPrint?: () => void;
  showPrintButton?: boolean;
  children: ReactNode;
}

export function PrintPageShell({
  documentTitle,
  documentNumber,
  issuedAtLabel,
  onPrint,
  showPrintButton = true,
  children,
}: PrintPageShellProps) {
  return (
    <section className="print-page-shell mx-auto max-w-[900px] space-y-4 p-4 sm:p-6">
      {showPrintButton ? (
        <div className="no-print flex items-center justify-end">
          <button
            type="button"
            onClick={onPrint ?? (() => window.print())}
            className="px-3 py-1 text-sm font-medium text-black border"
          >
            Print Document
          </button>
        </div>
      ) : null}

      <article className="bg-white text-black">
        <header className="pb-3">
          <h1 className="text-xl font-bold">{documentTitle}</h1>
          <div className="mt-1 text-sm">
            <div>
              <strong>Document No.:</strong> {documentNumber ?? "-"}
            </div>
            <div>
              <strong>Issued:</strong> {issuedAtLabel ?? "-"}
            </div>
          </div>
        </header>

        <div className="mt-4 leading-7">{children}</div>
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
