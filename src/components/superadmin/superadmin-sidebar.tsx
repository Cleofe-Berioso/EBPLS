"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, ClipboardList, LayoutDashboard, Settings, UserCircle2, Users } from "lucide-react";
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

const SUPERADMIN_SIDEBAR_ITEMS: SidebarGroup[] = [
  { label: "Dashboard", href: "/superadmin/dashboard" },
  {
    group: "Audit & Reports",
    items: [
      { label: "Applications", href: "/superadmin/applications" },
      { label: "Activity Log", href: "/superadmin/activities" },
      { label: "Reports", href: "/superadmin/reports" },
    ],
  },
  {
    group: "Management",
    items: [
      { label: "Users", href: "/superadmin/users" },
      { label: "Settings", href: "/superadmin/settings" },
    ],
  },
  { label: "Profile", href: "/superadmin/profile" },
];

const SIDEBAR_ICONS = {
  Dashboard: LayoutDashboard,
  Applications: ClipboardList,
  "Activity Log": Activity,
  Users,
  Settings,
  Reports: BarChart3,
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

export function SuperAdminSidebar({
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
          portalTitle="IT Administrator Portal"
          description="Monitor users, reports, settings, and audit activity."
          roleType="SUPER_ADMIN"
          roleLabel="IT Administrator"
          collapsed={collapsed}
        />
      </div>

      <nav className={`app-sidebar-nav ${sidebarNavPaddingClass(collapsed)}`} aria-label="IT Administrator navigation">
        {SUPERADMIN_SIDEBAR_ITEMS.map((item, idx) => {
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
