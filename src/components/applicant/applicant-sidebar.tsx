"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, FileText, FolderOpen, LayoutDashboard, MapPin, Receipt, User } from "lucide-react";
import { RoleBadge } from "@/components/ui/role-badge";

type SidebarItem = {
  label: string;
  href: string;
};

type SidebarGroup = {
  group: string;
  items: SidebarItem[];
} | SidebarItem;

const APPLICANT_SIDEBAR_STRUCTURE: SidebarGroup[] = [
  { label: "Dashboard", href: "/applicant/dashboard" },
  {
    group: "Applications",
    items: [
      { label: "File Application", href: "/applicant/application" },
      { label: "My Applications", href: "/applicant/my-applications" },
      { label: "Tax Order / Payment", href: "/applicant/top" },
    ],
  },
  { label: "Notifications", href: "/applicant/notifications" },
  { label: "Profile", href: "/applicant/profile" },
];

const SIDEBAR_ICONS = {
  Dashboard: LayoutDashboard,
  "File Application": FileText,
  "My Applications": FolderOpen,
  "Tax Order / Payment": Receipt,
  Notifications: Bell,
  Profile: User,
} as const;

export function ApplicantSidebar({
  mobileOpen,
  collapsed,
  onCloseMobile,
}: {
  mobileOpen: boolean;
  collapsed: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();

  const renderNavItem = (item: SidebarItem) => {
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
  };

  return (
    <aside
      className={`app-sidebar fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-200 lg:z-30 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } ${collapsed ? "w-20" : "w-72"}`}
    >
      <div className={`border-b border-slate-200 px-5 py-5 ${collapsed ? "lg:px-3" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Municipality eBPLS</p>
            <h2 className={`mt-2 text-lg font-semibold text-slate-900 ${collapsed ? "lg:hidden" : ""}`}>Applicant Portal</h2>
            <p className={`mt-1 text-sm text-slate-600 ${collapsed ? "lg:hidden" : ""}`}>Submit, track, and monitor your applications.</p>
          </div>
        </div>
        <div className={`mt-3 flex items-center gap-2 ${collapsed ? "lg:justify-center" : ""}`}>
          <RoleBadge role="APPLICANT" label="Applicant Portal" />
        </div>
      </div>

      <nav className={`overflow-y-auto py-4 lg:flex-1 ${collapsed ? "px-2" : "px-3"}`}>
        {APPLICANT_SIDEBAR_STRUCTURE.map((item, idx) => {
          if ("href" in item) {
            return <div key={item.href}>{renderNavItem(item)}</div>;
          } else {
            return (
              <div key={item.group} className={`${idx > 0 ? "mt-4" : ""}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide text-slate-500 ${collapsed ? "lg:hidden" : "px-3 py-2"}`}>
                  {collapsed ? "" : item.group}
                </p>
                <div className="space-y-1">
                  {item.items.map((subitem) => renderNavItem(subitem))}
                </div>
              </div>
            );
          }
        })}
      </nav>

      <div className={`border-t border-slate-200 px-4 py-4 ${collapsed ? "lg:hidden" : ""}`}>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-xs text-slate-700 shadow-sm">
          <p className="font-semibold uppercase tracking-[0.18em] text-slate-500">Workflow Guide</p>
          <p className="mt-2 leading-6">
            Draft → Submitted → Under Review → Assessed → Approved for Payment → Paid → For Release → Released
          </p>
        </div>
      </div>
    </aside>
  );
}
