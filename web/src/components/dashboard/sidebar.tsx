"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Upload,
  CheckSquare,
  BarChart3,
  Users,
  Settings,
  Shield,
  Printer,
  X,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  File,
  MapPin,
  CreditCard,
  DollarSign,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

interface SidebarProps {
  user: {
    role: Role;
    firstName: string;
    lastName: string;
  };
  /** Mobile drawer: whether the sidebar is open */
  isOpen?: boolean;
  /** Mobile drawer: callback to close the sidebar */
  onClose?: () => void;
  /** Desktop: whether the sidebar is in collapsed (icon-only) mode */
  collapsed?: boolean;
  /** Desktop: callback to toggle collapsed state */
  onToggleCollapse?: () => void;
  isRenewalEligible?: boolean;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: Role[];
}

// ── APPLICANT NAVIGATION ──
const applicantNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5 shrink-0" />,
    roles: ["APPLICANT"],
  },
  {
    label: "My Applications",
    href: "/dashboard/applications",
    icon: <FileText className="h-5 w-5 shrink-0" />,
    roles: ["APPLICANT"],
  },
  {
    label: "My Documents",
    href: "/dashboard/documents",
    icon: <File className="h-5 w-5 shrink-0" />,
    roles: ["APPLICANT"],
  },
  {
    label: "Track Status",
    href: "/dashboard/tracking",
    icon: <AlertCircle className="h-5 w-5 shrink-0" />,
    roles: ["APPLICANT"],
  },
  {
    label: "Payments",
    href: "/dashboard/payments",
    icon: <DollarSign className="h-5 w-5 shrink-0" />,
    roles: ["APPLICANT"],
  },
  {
    label: "My Permit",
    href: "/dashboard/permits",
    icon: <Shield className="h-5 w-5 shrink-0" />,
    roles: ["APPLICANT"],
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: <Users className="h-5 w-5 shrink-0" />,
    roles: ["APPLICANT"],
  },
];

// ── BPLO OFFICE NAVIGATION ──
const bploNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5 shrink-0" />,
    roles: ["BPLO_OFFICE"],
  },
  {
    label: "Applications",
    href: "/dashboard/applications",
    icon: <FileText className="h-5 w-5 shrink-0" />,
    roles: ["BPLO_OFFICE"],
  },
  {
    label: "Business Map",
    href: "/dashboard/admin/locations",
    icon: <MapPin className="h-5 w-5 shrink-0" />,
    roles: ["BPLO_OFFICE"],
  },
  {
    label: "Document Verification",
    href: "/dashboard/verify-documents",
    icon: <CheckSquare className="h-5 w-5 shrink-0" />,
    roles: ["BPLO_OFFICE"],
  },
  {
    label: "Review Queue",
    href: "/dashboard/review",
    icon: <ClipboardList className="h-5 w-5 shrink-0" />,
    roles: ["BPLO_OFFICE"],
  },
  {
    label: "Approved Applications",
    href: "/dashboard/approved-applications",
    icon: <FileText className="h-5 w-5 shrink-0" />,
    roles: ["BPLO_OFFICE"],
  },
  {
    label: "Permit Issuance",
    href: "/dashboard/issuance",
    icon: <Printer className="h-5 w-5 shrink-0" />,
    roles: ["BPLO_OFFICE"],
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: <Users className="h-5 w-5 shrink-0" />,
    roles: ["BPLO_OFFICE"],
  },
];

// ── ADMIN NAVIGATION ──
const adminNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5 shrink-0" />,
    roles: ["ADMIN"],
  },
  {
    label: "All Applications",
    href: "/dashboard/admin/applications",
    icon: <FileText className="h-5 w-5 shrink-0" />,
    roles: ["ADMIN"],
  },
  {
    label: "Users",
    href: "/dashboard/admin/users",
    icon: <Users className="h-5 w-5 shrink-0" />,
    roles: ["ADMIN"],
  },
  {
    label: "Reports",
    href: "/dashboard/admin/reports",
    icon: <BarChart3 className="h-5 w-5 shrink-0" />,
    roles: ["ADMIN"],
  },
  {
    label: "Activity Logs",
    href: "/dashboard/admin/audit-logs",
    icon: <ClipboardList className="h-5 w-5 shrink-0" />,
    roles: ["ADMIN"],
  },
  {
    label: "Business Locations",
    href: "/dashboard/admin/locations",
    icon: <MapPin className="h-5 w-5 shrink-0" />,
    roles: ["ADMIN"],
  },
  {
    label: "Settings",
    href: "/dashboard/admin/settings",
    icon: <Settings className="h-5 w-5 shrink-0" />,
    roles: ["ADMIN"],
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: <Users className="h-5 w-5 shrink-0" />,
    roles: ["ADMIN"],
  },
];

// ── BPLO PAYMENT NAVIGATION ──
const paymentNav: NavItem[] = [
  {
    label: "Payment Queue",
    href: "/dashboard/payment-queue",
    icon: <CreditCard className="h-5 w-5 shrink-0" />,
    roles: ["BPLO_OFFICE"],
  },
  {
    label: "Payment Validation",
    href: "/dashboard/validate-payments",
    icon: <CheckSquare className="h-5 w-5 shrink-0" />,
    roles: ["BPLO_OFFICE"],
  },
  {
    label: "Receipts",
    href: "/dashboard/receipts",
    icon: <Receipt className="h-5 w-5 shrink-0" />,
    roles: ["BPLO_OFFICE"],
  },
  {
    label: "Paid Applications",
    href: "/dashboard/paid-applications",
    icon: <FileText className="h-5 w-5 shrink-0" />,
    roles: ["BPLO_OFFICE"],
  },
  {
    label: "Payment Reports",
    href: "/dashboard/payment-reports",
    icon: <BarChart3 className="h-5 w-5 shrink-0" />,
    roles: ["BPLO_OFFICE"],
  },
];

// Combine all navigation items
const allNavItems = [...applicantNav, ...bploNav, ...paymentNav, ...adminNav];

const roleLabel: Partial<Record<Role, string>> = {
  APPLICANT: "Business Owner",
  BPLO_OFFICE: "BPLO Office",
  ADMIN: "System Administrator",
};

function SidebarContent({
  user,
  onClose,
  collapsed,
  onToggleCollapse,
}: {
  user: SidebarProps["user"];
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname() ?? "";
  const filteredItems = allNavItems.filter((item) => item.roles.includes(user.role));
  const userRole = roleLabel[user.role] ?? user.role;

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* ── Header / Logo ── */}
      <div
        className={cn(
          "flex items-center border-b border-sidebar-border py-4",
          collapsed ? "justify-center px-3" : "justify-between px-4"
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo */}
            <div className="relative h-9 w-9 shrink-0">
              <Image
                src="/assets/logo.png"
                alt="eBPLS Logo"
                fill
                className="object-contain rounded-md"
                onError={(e) => {
                  // Fallback to text avatar if image not found
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight text-sidebar-foreground truncate">
                eBPLS
              </p>
              <p className="text-[10px] leading-tight text-muted-foreground truncate">
                {userRole}
              </p>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="relative h-8 w-8 shrink-0">
            <Image
              src="/assets/logo.png"
              alt="eBPLS Logo"
              fill
              className="object-contain rounded-md"
              title={`eBPLS — ${userRole}`}
            />
          </div>
        )}

        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden ml-auto"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {onToggleCollapse && !onClose && (
          <button
            onClick={onToggleCollapse}
            className="hidden rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground lg:block"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {filteredItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    collapsed && "justify-center px-2.5",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  {item.icon}
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── User Footer ── */}
      {!collapsed && (
        <div className="border-t border-sidebar-border px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {userRole}
              </p>
            </div>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center border-t border-sidebar-border px-2 py-3">
          <div
            title={`${user.firstName} ${user.lastName} — ${userRole}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
          >
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardSidebar({ user, isOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden flex-shrink-0 border-r border-sidebar-border bg-sidebar transition-all duration-300 lg:block",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent user={user} collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 flex-shrink-0 border-r border-sidebar-border bg-sidebar shadow-xl transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent user={user} onClose={onClose} />
      </aside>
    </>
  );
}
