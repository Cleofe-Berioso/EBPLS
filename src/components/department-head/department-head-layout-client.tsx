"use client";

import { useEffect, useState, type ReactNode } from "react";
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

type DepartmentHeadProfileResponse = {
  profile?: {
    name?: string | null;
    hasProfilePicture?: boolean;
    profilePictureUrl?: string | null;
    profileImage?: {
      hasProfileImage?: boolean;
      signedUrl?: string | null;
    };
  };
};

type DepartmentHeadProfileUpdatedEventDetail = {
  name?: string;
  profilePictureUrl?: string | null;
};

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
  const [displayName, setDisplayName] = useState(userName);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileImageFailed, setProfileImageFailed] = useState(false);

  useEffect(() => {
    setDisplayName(userName);
  }, [userName]);

  useEffect(() => {
    let cancelled = false;

    async function loadDepartmentHeadProfile() {
      try {
        const response = await fetch("/api/department-head/profile", { cache: "no-store" });
        if (!response.ok) return;

        const data = (await response.json()) as DepartmentHeadProfileResponse;
        if (cancelled) return;

        const resolvedName = data.profile?.name?.trim();
        if (resolvedName) {
          setDisplayName(resolvedName);
        }

        const hasProfileImage = Boolean(
          data.profile?.profileImage?.hasProfileImage ?? data.profile?.hasProfilePicture
        );
        const resolvedImageUrl = data.profile?.profileImage?.signedUrl ?? data.profile?.profilePictureUrl ?? null;
        setProfileImageUrl(hasProfileImage ? resolvedImageUrl : null);
        setProfileImageFailed(false);
      } catch {
        // Keep fallback session name/icon when profile fetch fails.
      }
    }

    function onProfileUpdated(event: Event) {
      const detail = (event as CustomEvent<DepartmentHeadProfileUpdatedEventDetail>).detail;
      if (!detail) return;

      if (typeof detail.name === "string" && detail.name.trim()) {
        setDisplayName(detail.name.trim());
      }

      if (Object.prototype.hasOwnProperty.call(detail, "profilePictureUrl")) {
        setProfileImageUrl(detail.profilePictureUrl ?? null);
        setProfileImageFailed(false);
      }
    }

    void loadDepartmentHeadProfile();
    window.addEventListener("department-head-profile-updated", onProfileUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("department-head-profile-updated", onProfileUpdated);
    };
  }, []);

  return (
    <PortalLayoutRoot>
      <PortalMobileOverlay open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <DepartmentHeadSidebar
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        onCloseMobile={() => setMobileOpen(false)}
        userName={displayName}
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
              title={`Welcome, ${displayName}`}
              subtitle="Approval, verification, and compliance decisions"
            />
          </div>

          <PortalHeaderActions
            name={displayName}
            roleLabel="Department Head"
            profileHref="/department-head/profile"
            signOutAction={signOutAction}
            profileImageUrl={profileImageUrl}
            profileImageFailed={profileImageFailed}
            onProfileImageError={() => setProfileImageFailed(true)}
          />
        </PortalTopHeader>

        <PortalMain>{children}</PortalMain>
      </PortalContentColumn>
    </PortalLayoutRoot>
  );
}
