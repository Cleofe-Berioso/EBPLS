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
      className="group block h-full rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:shadow-sm hover:border-slate-300"
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Application</p>
          <h3 className="mt-3 text-2xl font-semibold leading-tight text-slate-900">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>

        <div className="mt-6">
          <span className="inline-block rounded-full px-3 py-1 text-sm font-semibold text-emerald-700 transition-colors group-hover:bg-emerald-50">
            Start Application →
          </span>
        </div>
      </div>
    </Link>
  );
}
