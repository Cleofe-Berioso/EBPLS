"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardCheck, ShieldAlert, ShieldCheck, ShieldX, Scale } from "lucide-react";
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

const DEPARTMENT_HEAD_SIDEBAR_ITEMS: SidebarGroup[] = [
  { label: "Dashboard", href: "/department-head/dashboard" },
  {
    group: "Approvals",
    items: [
      { label: "Application Approvals", href: "/department-head/application-approval" },
      { label: "Inspection Verification", href: "/department-head/inspection-verification" },
    ],
  },
  {
    group: "Compliance",
    items: [
      { label: "Flagged Cases", href: "/department-head/permit-to-revoke" },
      { label: "Settlement Management", href: "/department-head/settlement-management" },
    ],
  },
  {
    group: "Lists",
    items: [
      { label: "Compliant List", href: "/department-head/compliant-list" },
      { label: "Restrictions List", href: "/department-head/revoke-permit-list" },
    ],
  },
];

const SIDEBAR_ICONS = {
  Dashboard: LayoutDashboard,
  "Application Approvals": ClipboardCheck,
  "Inspection Verification": ShieldCheck,
  "Flagged Cases": ShieldAlert,
  "Settlement Management": Scale,
  "Compliant List": ShieldCheck,
  "Restrictions List": ShieldX,
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

export function DepartmentHeadSidebar({
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
          portalTitle="Department Head Portal"
          description="Approve applications and resolve compliance decisions."
          roleType="DEPARTMENT_HEAD"
          roleLabel="Department Head"
          collapsed={collapsed}
        />
      </div>

      <nav className={`app-sidebar-nav ${sidebarNavPaddingClass(collapsed)}`} aria-label="Department Head navigation">
        {DEPARTMENT_HEAD_SIDEBAR_ITEMS.map((item, idx) => {
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
