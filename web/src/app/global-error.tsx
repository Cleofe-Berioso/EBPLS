"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface-muted)]">
          <div className="w-full max-w-md rounded-lg bg-[var(--surface)] p-8 text-center shadow-lg">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Critical Error</h1>
            <p className="mt-2 text-[var(--text-secondary)]">
              {error.message || "A critical error occurred."}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Error ID: {error.digest}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => reset()}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
