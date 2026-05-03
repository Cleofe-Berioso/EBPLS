type RoleBadgeValue = "APPLICANT" | "BPLO" | "SUPER_ADMIN" | "VIEW_ONLY";

const ROLE_STYLES: Record<RoleBadgeValue, string> = {
  APPLICANT: "border border-green-200 bg-green-50 text-green-900",
  BPLO: "border border-green-200 bg-green-50 text-green-900",
  SUPER_ADMIN: "border border-slate-200 bg-slate-100 text-slate-800",
  VIEW_ONLY: "border border-slate-200 bg-slate-100 text-slate-800",
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
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${ROLE_STYLES[role]}`}
    >
      {label ?? role.replace("_", " ")}
    </span>
  );
}
