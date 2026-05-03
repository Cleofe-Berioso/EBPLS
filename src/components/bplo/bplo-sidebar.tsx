"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardCheck, LayoutDashboard, MapPin, PackageCheck, ReceiptText, UserCircle2, Wallet } from "lucide-react";
import { RoleBadge } from "@/components/ui/role-badge";

const BPLO_SIDEBAR_ITEMS = [
  { label: "Dashboard", href: "/bplo/dashboard" },
  { label: "Applications Queue", href: "/bplo/applications" },
  { label: "Assessment & Fees", href: "/bplo/assessment-fees" },
  { label: "Payment Verification", href: "/bplo/payment-verification" },
  { label: "Permit Issuance", href: "/bplo/permit-issuance" },
  { label: "Business Map", href: "/bplo/business-map" },
  { label: "Reports", href: "/bplo/reports" },
  { label: "Profile", href: "/bplo/profile" },
] as const;

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
      className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-200 lg:z-30 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } ${collapsed ? "w-20" : "w-72"}`}
    >
      <div className={`border-b border-slate-200 px-5 py-5 ${collapsed ? "lg:px-3" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-700">Municipality eBPLS</p>
            <h2 className={`mt-2 text-lg font-semibold text-slate-900 ${collapsed ? "lg:hidden" : ""}`}>BPLO Portal</h2>
            <p className={`mt-1 text-sm text-slate-600 ${collapsed ? "lg:hidden" : ""}`}>Manage application review, payment, and issuance queues.</p>
          </div>
        </div>
        <div className={`mt-3 flex items-center gap-2 ${collapsed ? "lg:justify-center" : ""}`}>
          <RoleBadge role="BPLO" label="BPLO Portal" />
        </div>
      </div>

      <nav className={`space-y-1 overflow-y-auto py-4 lg:flex-1 ${collapsed ? "px-2" : "px-3"}`}>
        {BPLO_SIDEBAR_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = SIDEBAR_ICONS[item.label];
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                active
                  ? "bg-green-50 text-green-900 ring-1 ring-green-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              } ${collapsed ? "lg:justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`h-4 w-4 ${active ? "text-green-700" : "text-slate-400"}`} />
              <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={`border-t border-slate-200 px-4 py-4 ${collapsed ? "lg:hidden" : ""}`}>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-xs text-slate-700">
          <p className="font-semibold uppercase tracking-[0.18em] text-slate-500">Workflow Guide</p>
          <p className="mt-2 leading-6">
          {"Applicant Application -> BPLO Application Queue -> Assessment and Fee -> Tax Order of Payment -> Pay Now -> Payment Verification -> Permit / Closure Release -> Business Location mapping update."}
          </p>
        </div>
      </div>
    </aside>
  );
}
