"use client";

import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen, UserCircle2, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { BploSidebar } from "@/components/bplo/bplo-sidebar";
import { actionButtonStyles } from "@/components/ui/action-button";

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
    <div className="app-shell bg-transparent text-slate-900">
      {mobileOpen ? (
        <div
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/30 transition-opacity lg:hidden"
        />
      ) : null}

      <BploSidebar
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={`min-w-0 transition-[padding] duration-200 ${collapsed ? "lg:pl-20" : "lg:pl-72"}`}>
        <header className="app-header sticky top-0 z-30">
          <div className="flex min-h-[76px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen((value) => !value)}
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? "Close sidebar" : "Open sidebar"}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setCollapsed((value) => !value)}
                aria-expanded={!collapsed}
                aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
                className="hidden h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:inline-flex"
              >
                {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700">BPLO Portal</p>
                <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">Welcome, {displayName}</h1>
                <p className="truncate text-sm text-slate-500">Queue-focused operational workspace</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden min-w-0 text-right sm:block">
                <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                <p className="truncate text-xs text-slate-500">BPLO Portal</p>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                {profileImageUrl && !profileImageFailed ? (
                  <img
                    src={profileImageUrl}
                    alt={`${displayName} profile picture`}
                    className="h-10 w-10 rounded-xl object-cover"
                    onError={() => setProfileImageFailed(true)}
                  />
                ) : (
                  <UserCircle2 className="h-5 w-5" />
                )}
              </span>
              <Link href="/bplo/profile" className={actionButtonStyles("secondary", "sm")}>
                Profile
              </Link>
              <form action={signOutAction}>
                <button className={actionButtonStyles("primary", "sm")} type="submit">
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="app-shell-main min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
