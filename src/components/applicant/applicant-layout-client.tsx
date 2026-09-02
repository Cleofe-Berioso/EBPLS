"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApplicantSidebar } from "@/components/applicant/applicant-sidebar";
import { NotificationDropdown } from "@/components/applicant/notification-dropdown";
import { actionButtonStyles } from "@/components/ui/action-button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { LoadingState } from "@/components/ui/loading-state";
import {
  PortalContentColumn,
  PortalGuardMain,
  PortalHeaderActions,
  PortalHeaderBrand,
  PortalLayoutRoot,
  PortalMain,
  PortalMobileOverlay,
  PortalNavToggles,
  PortalTopHeader,
} from "@/components/ui/portal-layout-shell";

import {
  APPLICANT_PROFILE_SETUP_PATH,
  clearApplicantProfileSetupNextPath,
  isAllowedApplicantNextPath,
  readApplicantProfileSetupNextPath,
  writeApplicantProfileSetupNextPath,
} from "@/lib/applicant-profile-setup-next";

type ProfileGuardState = "checking" | "ready" | "require_profile_picture" | "error";

export function ApplicantLayoutClient({
  userName,
  signOutAction,
  children,
}: {
  userName: string;
  signOutAction: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [guardState, setGuardState] = useState<ProfileGuardState>("checking");
  const [guardError, setGuardError] = useState<string | null>(null);
  const [guardAttempt, setGuardAttempt] = useState(0);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileImageFailed, setProfileImageFailed] = useState(false);

  const hasProfileRef = useRef(false);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (isCheckingRef.current) return;

    const onSetupPage = pathname.startsWith(APPLICANT_PROFILE_SETUP_PATH);

    if (hasProfileRef.current && !onSetupPage) {
      setGuardError(null);
      setGuardState("ready");
      return;
    }

    let active = true;
    isCheckingRef.current = true;
    setGuardError(null);
    setGuardState("checking");

    async function runProfilePictureGuard() {
      try {
        const response = await fetch("/api/applicant/profile-picture", { cache: "no-store" });
        if (!response.ok) {
          let message = "Unable to verify profile picture. Please retry.";
          try {
            const errorData = (await response.json()) as { error?: string };
            message = errorData.error ?? message;
          } catch {
            // Keep default fallback error when payload is not JSON.
          }

          if (active) {
            setGuardError(message);
            setGuardState("error");
          }
          return;
        }

        const data = (await response.json()) as {
          hasProfilePicture?: boolean;
          profilePictureUrl?: string | null;
          profileImage?: {
            hasProfileImage?: boolean;
            signedUrl?: string | null;
          };
        };

        const hasProfileImage = Boolean(
          data.profileImage?.hasProfileImage ?? data.hasProfilePicture
        );

        if (active) {
          setProfileImageUrl(data.profileImage?.signedUrl ?? data.profilePictureUrl ?? null);
          setProfileImageFailed(false);
        }

        if (!hasProfileImage && !onSetupPage) {
          if (active) {
            hasProfileRef.current = false;
            setGuardState("require_profile_picture");
          }

          const rawSearch = typeof window !== "undefined" ? window.location.search : "";
          const rawQuery = rawSearch.startsWith("?") ? rawSearch.slice(1) : rawSearch;
          const nextPath = rawQuery ? `${pathname}?${rawQuery}` : pathname;
          if (active) {
            writeApplicantProfileSetupNextPath(nextPath);
            router.replace(APPLICANT_PROFILE_SETUP_PATH);
          }
          return;
        }

        if (!hasProfileImage && onSetupPage) {
          if (active) {
            hasProfileRef.current = false;
            setGuardState("ready");
          }
          return;
        }

        if (hasProfileImage && onSetupPage) {
          const candidateNext = readApplicantProfileSetupNextPath();
          clearApplicantProfileSetupNextPath();
          const target = isAllowedApplicantNextPath(candidateNext)
            ? candidateNext
            : "/applicant/dashboard";
          if (active) {
            hasProfileRef.current = true;
            setGuardState("ready");
            router.replace(target);
          }
          return;
        }

        if (active) {
          hasProfileRef.current = hasProfileImage;
          setGuardState("ready");
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to verify profile picture. Please retry.";
        if (active) {
          setGuardError(message);
          setGuardState("error");
        }
      } finally {
        if (active) {
          isCheckingRef.current = false;
        }
      }
    }

    void runProfilePictureGuard();

    return () => {
      active = false;
      isCheckingRef.current = false;
    };
  }, [pathname, guardAttempt, router]);

  if (guardState === "error") {
    return (
      <PortalLayoutRoot>
        <PortalGuardMain>
          <div className="app-surface p-4 sm:p-5">
            <InlineAlert variant="error" title="Profile check failed" message={guardError ?? "Unable to verify profile picture."} />
            <button
              type="button"
              onClick={() => setGuardAttempt((value) => value + 1)}
              className={`${actionButtonStyles("secondary", "sm")} mt-4`}
            >
              Retry Profile Check
            </button>
          </div>
        </PortalGuardMain>
      </PortalLayoutRoot>
    );
  }

  if (guardState !== "ready") {
    return (
      <PortalLayoutRoot>
        <PortalGuardMain>
          <LoadingState
            compact
            message={
              guardState === "require_profile_picture"
                ? "Profile picture is required. Redirecting to setup…"
                : "Checking profile picture requirement…"
            }
          />
        </PortalGuardMain>
      </PortalLayoutRoot>
    );
  }

  return (
    <PortalLayoutRoot>
      <PortalMobileOverlay open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <ApplicantSidebar
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
              collapsed={collapsed}
              onCollapseToggle={() => setCollapsed((value) => !value)}
            />
            <PortalHeaderBrand
              eyebrow="Applicant Portal"
              title={`Welcome, ${userName}`}
              subtitle="Track applications, payments, and permit status"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationDropdown />
            <PortalHeaderActions
              name={userName}
              roleLabel="Applicant"
              profileHref="/applicant/profile"
              signOutAction={signOutAction}
              profileImageUrl={profileImageUrl}
              profileImageFailed={profileImageFailed}
              onProfileImageError={() => setProfileImageFailed(true)}
            />
          </div>
        </PortalTopHeader>

        <PortalMain>{children}</PortalMain>
      </PortalContentColumn>
    </PortalLayoutRoot>
  );
}
