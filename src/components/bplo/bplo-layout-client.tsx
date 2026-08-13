"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BploSidebar } from "@/components/bplo/bplo-sidebar";
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

type BploProfileResponse = {
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

type BploProfileUpdatedEventDetail = {
  name?: string;
  profilePictureUrl?: string | null;
};

export function BploLayoutClient({
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

    async function loadBploProfile() {
      try {
        const response = await fetch("/api/bplo/profile", { cache: "no-store" });
        if (!response.ok) return;

        const data = (await response.json()) as BploProfileResponse;
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
      const detail = (event as CustomEvent<BploProfileUpdatedEventDetail>).detail;
      if (!detail) return;

      if (typeof detail.name === "string" && detail.name.trim()) {
        setDisplayName(detail.name.trim());
      }

      if (Object.prototype.hasOwnProperty.call(detail, "profilePictureUrl")) {
        setProfileImageUrl(detail.profilePictureUrl ?? null);
        setProfileImageFailed(false);
      }
    }

    void loadBploProfile();
    window.addEventListener("bplo-profile-updated", onProfileUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("bplo-profile-updated", onProfileUpdated);
    };
  }, []);

  return (
    <PortalLayoutRoot>
      <PortalMobileOverlay open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <BploSidebar
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
              eyebrow="BPLO Portal"
              title={`Welcome, ${displayName}`}
              subtitle="Government operations command center"
            />
          </div>

          <PortalHeaderActions
            name={displayName}
            roleLabel="BPLO Official"
            profileHref="/bplo/profile"
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
