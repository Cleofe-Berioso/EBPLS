type RoleBadgeValue = "APPLICANT" | "BPLO" | "SUPER_ADMIN" | "DEPARTMENT_HEAD" | "JIT" | "VIEW_ONLY";

const ROLE_STYLES: Record<RoleBadgeValue, string> = {
  APPLICANT: "border border-emerald-200 bg-emerald-50 text-emerald-800",
  BPLO: "border border-blue-200 bg-blue-50 text-blue-800",
  SUPER_ADMIN: "border border-indigo-200 bg-indigo-50 text-indigo-800",
  DEPARTMENT_HEAD: "border border-violet-200 bg-violet-50 text-violet-800",
  JIT: "border border-cyan-200 bg-cyan-50 text-cyan-800",
  VIEW_ONLY: "border border-slate-200 bg-slate-100 text-slate-700",
};

export function RoleBadge({
  role,
  label,
}: {
  role: RoleBadgeValue;
  label?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${ROLE_STYLES[role]}`}
    >
      {label ?? role.replace("_", " ")}
    </span>
  );
}
