"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { useUIStore } from "@/lib/stores";
import type { Role } from "@prisma/client";

interface ShellProps {
  user: {
    firstName: string;
    lastName: string;
    email?: string | null;
    role: Role;
  };
  userStatus?: string | null;
  children: React.ReactNode;
}

/**
 * DashboardShell — client wrapper that manages the mobile sidebar open state
 * and wires Zustand UI store for sidebar collapse + notifications.
 */
export function DashboardShell({
  user,
  userStatus,
  children,
}: ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  // Sync Zustand sidebar state with local mobile state on mount
  useEffect(() => {
    // ensure no SSR mismatch — runs only on client
  }, []);
  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardHeader
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
