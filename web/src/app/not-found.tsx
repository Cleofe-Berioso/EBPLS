import Link from "next/link";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface-muted)] px-4 text-center">
      <div className="rounded-full bg-blue-100 p-5">
        <FileQuestion className="h-14 w-14 text-[var(--accent)]" />
      </div>
      <h1 className="mt-6 text-6xl font-extrabold text-[var(--text-primary)]">404</h1>
      <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
        Page Not Found
      </h2>
      <p className="mt-3 max-w-md text-sm text-[var(--background)]0">
        The page you are looking for doesn&apos;t exist or has been moved.
        Please check the URL or navigate back to the dashboard.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          <Home className="h-4 w-4" />
          Go to Dashboard
        </Link>
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-6 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Go to Sign In
        </Link>
      </div>
    </div>
  );
}
