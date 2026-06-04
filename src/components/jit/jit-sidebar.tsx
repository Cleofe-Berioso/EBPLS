"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPinned, ScanSearch, FileText } from "lucide-react";
import { RoleBadge } from "@/components/ui/role-badge";

type SidebarItem = {
  label: string;
  href: string;
};

const JIT_SIDEBAR_ITEMS: SidebarItem[] = [
  { label: "Dashboard", href: "/jit/dashboard" },
  { label: "Business Map", href: "/jit/business-map" },
  { label: "Inspect a Business", href: "/jit/inspect-a-business" },
  { label: "No Permit Record", href: "/jit/no-permit-record" },
];

const SIDEBAR_ICONS = {
  Dashboard: LayoutDashboard,
  "Business Map": MapPinned,
  "Inspect a Business": ScanSearch,
  "No Permit Record": FileText,
} as const;

export function JitSidebar({
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
      className={`app-sidebar fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-200 lg:z-30 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "w-20" : "w-72"}`}
    >
      <div className={`border-b border-slate-200 px-5 py-5 ${collapsed ? "lg:px-3" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-700">Business Permit Online System</p>
            <h2 className={`mt-2 text-lg font-semibold text-slate-900 ${collapsed ? "lg:hidden" : ""}`}>JIT Portal</h2>
            <p className={`mt-1 text-sm text-slate-600 ${collapsed ? "lg:hidden" : ""}`}>Joint Inspection Team workspace for dashboard and inspection queue shell.</p>
          </div>
        </div>
        <div className={`mt-3 flex items-center gap-2 ${collapsed ? "lg:justify-center" : ""}`}>
          <RoleBadge role="VIEW_ONLY" label="JIT" />
        </div>
      </div>

      <nav className={`overflow-y-auto py-4 lg:flex-1 ${collapsed ? "px-2" : "px-3"}`}>
        {JIT_SIDEBAR_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = SIDEBAR_ICONS[item.label as keyof typeof SIDEBAR_ICONS];

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${active
                  ? "bg-cyan-50 text-cyan-900 ring-1 ring-cyan-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                } ${collapsed ? "lg:justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              {Icon && <Icon className={`h-4 w-4 ${active ? "text-cyan-700" : "text-slate-400"}`} />}
              <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}