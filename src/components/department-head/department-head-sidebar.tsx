"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardCheck, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { RoleBadge } from "@/components/ui/role-badge";

type SidebarItem = {
  label: string;
  href: string;
};

const DEPARTMENT_HEAD_SIDEBAR_ITEMS: SidebarItem[] = [
  { label: "Dashboard", href: "/department-head/dashboard" },
  { label: "Application Approvals", href: "/department-head/application-approval" },
  { label: "Inspection Verification", href: "/department-head/inspection-verification" },
  { label: "Flagged Cases", href: "/department-head/permit-to-revoke" },
  { label: "Compliant List", href: "/department-head/compliant-list" },
  { label: "Restrictions List", href: "/department-head/revoke-permit-list" },
];

const SIDEBAR_ICONS = {
  Dashboard: LayoutDashboard,
  "Application Approvals": ClipboardCheck,
  "Inspection Verification": ShieldCheck,
  "Flagged Cases": ShieldAlert,
  "Compliant List": ShieldCheck,
  "Restrictions List": ShieldX,
} as const;

export function DepartmentHeadSidebar({
  mobileOpen,
  collapsed,
  onCloseMobile,
}: {
  mobileOpen: boolean;
  collapsed: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={`app-sidebar fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-200 lg:z-30 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } ${collapsed ? "w-20" : "w-72"}`}
    >
      <div className={`border-b border-slate-200 px-5 py-5 ${collapsed ? "lg:px-3" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Business Permit Online System</p>
            <h2 className={`mt-2 text-lg font-semibold text-slate-900 ${collapsed ? "lg:hidden" : ""}`}>Department Head</h2>
            <p className={`mt-1 text-sm text-slate-600 ${collapsed ? "lg:hidden" : ""}`}>Manage application approvals, inspection verification, compliant cases, flagged cases, and restrictions.</p>
          </div>
        </div>
        <div className={`mt-3 flex items-center gap-2 ${collapsed ? "lg:justify-center" : ""}`}>
          <RoleBadge role="VIEW_ONLY" label="Department Head" />
        </div>
      </div>

      <nav className={`overflow-y-auto py-4 lg:flex-1 ${collapsed ? "px-2" : "px-3"}`}>
        {DEPARTMENT_HEAD_SIDEBAR_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = SIDEBAR_ICONS[item.label as keyof typeof SIDEBAR_ICONS];

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                active
                  ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              } ${collapsed ? "lg:justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              {Icon && <Icon className={`h-4 w-4 ${active ? "text-emerald-700" : "text-slate-400"}`} />}
              <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}