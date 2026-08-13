"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardCheck, LayoutDashboard, MapPin, PackageCheck, ReceiptText, ShieldCheck, UserCircle2, Wallet } from "lucide-react";
import {
  PortalSidebarBrand,
  PortalSidebarFooter,
  sidebarAsideClass,
  sidebarGroupLabelClass,
  sidebarHeaderClass,
  sidebarNavIconClass,
  sidebarNavLabelClass,
  sidebarNavLinkClass,
  sidebarNavPaddingClass,
} from "@/components/ui/portal-layout-shell";

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
  { label: "Inspection Review", href: "/bplo/inspection-review" },
  { label: "Business Map", href: "/bplo/business-map" },
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
  "Inspection Review": ShieldCheck,
  Profile: UserCircle2,
} as const;

function renderSidebarLink(
  item: SidebarItem,
  pathname: string,
  collapsed: boolean,
  onCloseMobile: () => void
) {
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = SIDEBAR_ICONS[item.label as keyof typeof SIDEBAR_ICONS];

  return (
    <Link
      key={item.href}
      href={item.href}
      onClick={onCloseMobile}
      className={sidebarNavLinkClass(active, collapsed)}
      title={collapsed ? item.label : undefined}
    >
      {Icon ? <Icon className={sidebarNavIconClass(active)} /> : null}
      <span className={sidebarNavLabelClass(collapsed)}>{item.label}</span>
    </Link>
  );
}

export function BploSidebar({
  mobileOpen,
  collapsed,
  onCloseMobile,
  userName,
  onCollapseToggle,
}: {
  mobileOpen: boolean;
  collapsed: boolean;
  onCloseMobile: () => void;
  userName: string;
  onCollapseToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className={sidebarAsideClass(mobileOpen, collapsed)}>
      <div className={sidebarHeaderClass(collapsed)}>
        <PortalSidebarBrand
          portalTitle="BPLO Portal"
          description="Review, assess, verify, and release permit queues."
          roleType="BPLO"
          roleLabel="BPLO Official"
          collapsed={collapsed}
        />
      </div>

      <nav className={`app-sidebar-nav ${sidebarNavPaddingClass(collapsed)}`} aria-label="BPLO navigation">
        {BPLO_SIDEBAR_ITEMS.map((item, idx) => {
          if ("href" in item) {
            return (
              <div key={item.href} className={idx > 0 ? "mt-1" : ""}>
                {renderSidebarLink(item, pathname, collapsed, onCloseMobile)}
              </div>
            );
          }

          return (
            <div key={item.group} className={`${idx > 0 ? "mt-4" : ""}`}>
              <p className={sidebarGroupLabelClass(collapsed)}>{item.group}</p>
              {collapsed ? <div className="app-sidebar-group-divider" /> : null}
              <div className="space-y-0.5">
                {item.items.map((subitem) => renderSidebarLink(subitem, pathname, collapsed, onCloseMobile))}
              </div>
            </div>
          );
        })}
      </nav>

      <PortalSidebarFooter userName={userName} collapsed={collapsed} onCollapseToggle={onCollapseToggle} />
    </aside>
  );
}
