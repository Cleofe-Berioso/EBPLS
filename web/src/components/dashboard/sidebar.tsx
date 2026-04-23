"use client";

import Link from "next/link";
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
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ["APPLICANT"],
  },
  {
    label: "My Applications",
    href: "/dashboard/applications",
    icon: <FileText className="h-5 w-5" />,
    roles: ["APPLICANT"],
  },
  {
    label: "My Documents",
    href: "/dashboard/documents",
    icon: <File className="h-5 w-5" />,
    roles: ["APPLICANT"],
  },
  {
    label: "Track Status",
    href: "/dashboard/tracking",
    icon: <AlertCircle className="h-5 w-5" />,
    roles: ["APPLICANT"],
  },
  {
    label: "Payments",
    href: "/dashboard/payments",
    icon: <DollarSign className="h-5 w-5" />,
    roles: ["APPLICANT"],
  },
  {
    label: "My Permit",
    href: "/dashboard/permits",
    icon: <Shield className="h-5 w-5" />,
    roles: ["APPLICANT"],
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: <Users className="h-5 w-5" />,
    roles: ["APPLICANT"],
  },
];

// ── BPLO OFFICE NAVIGATION ──
const bploNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ["BPLO_OFFICE"],
  },
  {
    label: "Applications",
    href: "/dashboard/applications",
    icon: <FileText className="h-5 w-5" />,
    roles: ["BPLO_OFFICE"],
  },
  {
    label: "Document Verification",
    href: "/dashboard/verify-documents",
    icon: <CheckSquare className="h-5 w-5" />,
    roles: ["BPLO_OFFICE"],
  },
  {
    label: "Review Queue",
    href: "/dashboard/review",
    icon: <ClipboardList className="h-5 w-5" />,
    roles: ["BPLO_OFFICE"],
  },
  {
    label: "Approved Applications",
    href: "/dashboard/approved-applications",
    icon: <FileText className="h-5 w-5" />,
    roles: ["BPLO_OFFICE"],
  },
  {
    label: "Permit Issuance",
    href: "/dashboard/issuance",
    icon: <Printer className="h-5 w-5" />,
    roles: ["BPLO_OFFICE"],
  },
  {
    label: "Business Locations",
    href: "/dashboard/admin/locations",
    icon: <MapPin className="h-5 w-5" />,
    roles: ["BPLO_OFFICE"],
  },
  {
    label: "Reports",
    href: "/dashboard/admin/reports",
    icon: <BarChart3 className="h-5 w-5" />,
    roles: ["BPLO_OFFICE"],
  },
  {
    label: "Activity Logs",
    href: "/dashboard/admin/audit-logs",
    icon: <ClipboardList className="h-5 w-5" />,
    roles: ["BPLO_OFFICE"],
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: <Users className="h-5 w-5" />,
    roles: ["BPLO_OFFICE"],
  },
];

// ── MTO NAVIGATION ──
const mtoNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ["MTO"],
  },
  {
    label: "Payment Queue",
    href: "/dashboard/payment-queue",
    icon: <CreditCard className="h-5 w-5" />,
    roles: ["MTO"],
  },
  {
    label: "Payment Validation",
    href: "/dashboard/validate-payments",
    icon: <CheckSquare className="h-5 w-5" />,
    roles: ["MTO"],
  },
  {
    label: "Receipts",
    href: "/dashboard/receipts",
    icon: <Receipt className="h-5 w-5" />,
    roles: ["MTO"],
  },
  {
    label: "Paid Applications",
    href: "/dashboard/paid-applications",
    icon: <FileText className="h-5 w-5" />,
    roles: ["MTO"],
  },
  {
    label: "Payment Reports",
    href: "/dashboard/payment-reports",
    icon: <BarChart3 className="h-5 w-5" />,
    roles: ["MTO"],
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: <Users className="h-5 w-5" />,
    roles: ["MTO"],
  },
];

// Combine all navigation items
const allNavItems = [...applicantNav, ...bploNav, ...mtoNav];

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

  // Map role to display label
  const roleLabel = {
    APPLICANT: "Business Owner",
    BPLO_OFFICE: "BPLO Office",
    MTO: "MTO Staff",
  }[user.role] || user.role;

  return (
    <div className="flex h-full flex-col bg-[var(--surface)]">
      <div
        className={cn(
          "flex items-center border-b border-[var(--border)] py-4",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-[var(--text-primary)]">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[11px] leading-tight text-[var(--text-secondary)]">
                {roleLabel}
              </p>
            </div>
          </div>
        )}

        {collapsed && (
          <div
            title={`${user.firstName} ${user.lastName}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white"
          >
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
        )}

        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {onToggleCollapse && !onClose && (
          <button
            onClick={onToggleCollapse}
            className="hidden rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] lg:block"
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

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
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
                    collapsed && "justify-center px-2",
                    isActive
                      ? "bg-[var(--accent-light)] text-[var(--accent)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {item.icon}
                  {!collapsed && item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      {!collapsed && (
        <div className="border-t border-[var(--border)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-[var(--accent)]">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-[var(--text-secondary)] capitalize">
                {user.role === 'BPLO_OFFICE' ? 'BPLO Office' : user.role === 'MTO' ? 'MTO Staff' : user.role.toLowerCase().replace("_", " ")}
              </p>
            </div>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center border-t border-[var(--border)] px-2 py-4">
          <div
            title={`${user.firstName} ${user.lastName}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-[var(--accent)]"
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
      <aside
        className={cn(
          "hidden flex-shrink-0 border-r border-[var(--border)] bg-[var(--surface)] transition-all duration-300 lg:block",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent user={user} collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 flex-shrink-0 border-r border-[var(--border)] bg-[var(--surface)] shadow-xl transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent user={user} onClose={onClose} />
      </aside>
    </>
  );
}
