"use client";

import { useState, type ReactNode } from "react";
import { SuperAdminSidebar } from "@/components/superadmin/superadmin-sidebar";
import {
  PortalContentColumn,
  PortalHeaderActions,
  PortalHeaderBrand,
  PortalLayoutRoot,
  PortalMain,
  PortalMobileOverlay,
  PortalNavToggles,
  PortalTopHeader,
} from "@/components/ui/portal-layout-shell";

export function SuperAdminLayoutClient({
  userName,
  signOutAction,
  children,
}: {
  userName: string;
  signOutAction: () => Promise<void>;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <PortalLayoutRoot>
      <PortalMobileOverlay open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <SuperAdminSidebar
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        onCloseMobile={() => setMobileOpen(false)}
        userName={userName}
        onCollapseToggle={() => setCollapsed((value) => !value)}
      />

      <PortalContentColumn collapsed={collapsed}>
        <PortalTopHeader>
          <div className="flex min-w-0 items-center gap-3">
            <PortalNavToggles
              mobileOpen={mobileOpen}
              onMobileToggle={() => setMobileOpen((value) => !value)}
            />
            <PortalHeaderBrand
              eyebrow="IT Administrator Portal"
              title={`Welcome, ${userName}`}
              subtitle="Audit, reports, users, and settings oversight"
            />
          </div>

          <PortalHeaderActions
            name={userName}
            roleLabel="IT Administrator"
            profileHref="/superadmin/profile"
            signOutAction={signOutAction}
          />
        </PortalTopHeader>

        <PortalMain>{children}</PortalMain>
      </PortalContentColumn>
    </PortalLayoutRoot>
  );
}
