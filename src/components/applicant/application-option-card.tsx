import Link from "next/link";
import { applicantSurfacePanelClass } from "@/components/applicant/applicant-ui-styles";

interface ApplicationOptionCardProps {
  title: string;
  description: string;
  href: string;
}

export function ApplicationOptionCard({ title, description, href }: ApplicationOptionCardProps) {
  return (
    <Link
      href={href}
      className={`group block h-full p-6 transition-colors hover:shadow-sm ${applicantSurfacePanelClass}`}
    >
      <div className="flex h-full flex-col justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--success)]">Application</p>
          <h3 className="mt-3 text-2xl font-semibold leading-tight text-[var(--foreground)]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">{description}</p>
        </div>

        <div className="mt-6">
          <span className="inline-block rounded-full px-3 py-1 text-sm font-semibold text-[var(--success)] transition-colors group-hover:bg-[var(--success-soft)]">
            Start Application →
          </span>
        </div>
      </div>
    </Link>
  );
}
