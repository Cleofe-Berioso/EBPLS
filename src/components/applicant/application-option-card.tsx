import Link from "next/link";

interface ApplicationOptionCardProps {
  title: string;
  description: string;
  href: string;
}

export function ApplicationOptionCard({ title, description, href }: ApplicationOptionCardProps) {
  return (
    <Link
      href={href}
      className="group app-surface block p-6 transition hover:border-emerald-200 hover:bg-emerald-50/40"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Application Type</p>
      <h3 className="mt-3 text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <p className="mt-6 text-sm font-semibold text-emerald-700 group-hover:text-emerald-800">Start Application</p>
    </Link>
  );
}
