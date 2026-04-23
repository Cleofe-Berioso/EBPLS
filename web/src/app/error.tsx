"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
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
        <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface-muted)] px-4">
          <div className="w-full max-w-md rounded-lg bg-[var(--surface)] p-8 text-center shadow-lg">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-[var(--danger)]" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-[var(--text-primary)]">
              Something went wrong
            </h1>
            <p className="mt-2 text-[var(--text-secondary)]">
              {error.message || "An unexpected error occurred."}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Error ID: {error.digest}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => reset()}
                className="flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              <Link
                href="/"
                className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
