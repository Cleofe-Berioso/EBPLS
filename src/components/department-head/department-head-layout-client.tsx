"use client";

import { useState, type ReactNode } from "react";
import { DepartmentHeadSidebar } from "@/components/department-head/department-head-sidebar";
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

export function DepartmentHeadLayoutClient({
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

      <DepartmentHeadSidebar
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
              eyebrow="Department Head Portal"
              title={`Welcome, ${userName}`}
              subtitle="Approval, verification, and compliance decisions"
            />
          </div>

          <PortalHeaderActions
            name={userName}
            roleLabel="Department Head"
            profileHref="/department-head/application-approval"
            signOutAction={signOutAction}
          />
        </PortalTopHeader>

        <PortalMain>{children}</PortalMain>
      </PortalContentColumn>
    </PortalLayoutRoot>
  );
}
