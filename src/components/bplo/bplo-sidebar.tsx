"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardCheck, LayoutDashboard, MapPin, PackageCheck, ReceiptText, UserCircle2, Wallet } from "lucide-react";
import { RoleBadge } from "@/components/ui/role-badge";

type SidebarItem = {
  label: string;
  href: string;
};

type SidebarGroup = {
  group: string;
  items: SidebarItem[];
} | SidebarItem;

const BPLO_SIDEBAR_ITEMS: SidebarGroup[] = [
  { label: "Dashboard", href: "/bplo/dashboard" },
  {
    group: "Application Review",
    items: [
      { label: "Applications Queue", href: "/bplo/applications" },
      { label: "Assessment & Fees", href: "/bplo/assessment-fees" },
      { label: "Payment Verification", href: "/bplo/payment-verification" },
      { label: "Permit Issuance", href: "/bplo/permit-issuance" },
    ],
  },
  { label: "Business Map", href: "/bplo/business-map" },
  { label: "Reports", href: "/bplo/reports" },
  { label: "Profile", href: "/bplo/profile" },
];

const SIDEBAR_ICONS = {
  Dashboard: LayoutDashboard,
  "Applications Queue": ClipboardCheck,
  "Assessment & Fees": ReceiptText,
  "Payment Verification": Wallet,
  "Permit Issuance": PackageCheck,
  "Business Map": MapPin,
  Reports: BarChart3,
  Profile: UserCircle2,
} as const;

export function BploSidebar({
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700">Municipality eBPLS</p>
            <h2 className={`mt-2 text-lg font-semibold text-slate-900 ${collapsed ? "lg:hidden" : ""}`}>BPLO Portal</h2>
            <p className={`mt-1 text-sm text-slate-600 ${collapsed ? "lg:hidden" : ""}`}>Manage application review, payment, and issuance queues.</p>
          </div>
        </div>
        <div className={`mt-3 flex items-center gap-2 ${collapsed ? "lg:justify-center" : ""}`}>
          <RoleBadge role="BPLO" label="BPLO Official" />
        </div>
      </div>

      <nav className={`overflow-y-auto py-4 lg:flex-1 ${collapsed ? "px-2" : "px-3"}`}>
        {BPLO_SIDEBAR_ITEMS.map((item, idx) => {
          if ("href" in item) {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = SIDEBAR_ICONS[item.label as keyof typeof SIDEBAR_ICONS];
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-blue-50 text-blue-900 ring-1 ring-blue-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                } ${collapsed ? "lg:justify-center" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                {Icon && <Icon className={`h-4 w-4 ${active ? "text-blue-700" : "text-slate-400"}`} />}
                <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
              </Link>
            );
          } else {
            return (
              <div key={item.group} className={`${idx > 0 ? "mt-4" : ""}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide text-slate-500 ${collapsed ? "lg:hidden" : "px-3 py-2"}`}>
                  {collapsed ? "" : item.group}
                </p>
                <div className="space-y-1">
                  {item.items.map((subitem) => {
                    const active = pathname === subitem.href || pathname.startsWith(`${subitem.href}/`);
                    const Icon = SIDEBAR_ICONS[subitem.label as keyof typeof SIDEBAR_ICONS];
                    return (
                      <Link
                        key={subitem.href}
                        href={subitem.href}
                        onClick={onCloseMobile}
                        className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                          active
                            ? "bg-blue-50 text-blue-900 ring-1 ring-blue-100"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        } ${collapsed ? "lg:justify-center" : ""}`}
                        title={collapsed ? subitem.label : undefined}
                      >
                        {Icon && <Icon className={`h-4 w-4 ${active ? "text-blue-700" : "text-slate-400"}`} />}
                        <span className={collapsed ? "lg:hidden" : ""}>{subitem.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }
        })}
      </nav>

      <div className={`border-t border-slate-200 px-4 py-4 ${collapsed ? "lg:hidden" : ""}`}>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm">
          <p className="font-semibold uppercase tracking-[0.15em] text-slate-500">Workflow Pipeline</p>
          <p className="mt-2 leading-relaxed">
            Draft → Submitted → Under Review → Assessed → Approved for Payment → Paid → For Release → Released
          </p>
        </div>
      </div>
    </aside>
  );
}
