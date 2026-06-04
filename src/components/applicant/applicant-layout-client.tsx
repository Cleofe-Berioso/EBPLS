"use client";

import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen, UserCircle2, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApplicantSidebar } from "@/components/applicant/applicant-sidebar";
import { NotificationDropdown } from "@/components/applicant/notification-dropdown";
import { actionButtonStyles } from "@/components/ui/action-button";

const PROFILE_PICTURE_SETUP_PATH = "/applicant/profile-picture/setup";
type ProfileGuardState = "checking" | "ready" | "require_profile_picture" | "error";

function isAllowedNextPath(value: string | null): value is string {
  return Boolean(
    value &&
      value.startsWith("/applicant/") &&
      !value.startsWith(PROFILE_PICTURE_SETUP_PATH)
  );
}

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

  // Refs to prevent repeated fetching. Reset when pathname changes so
  // post-upload navigation re-checks once, then stabilises.
  const hasProfileRef = useRef(false);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    // Guard: don't start a second concurrent check.
    if (isCheckingRef.current) return;

    const onSetupPage = pathname.startsWith(PROFILE_PICTURE_SETUP_PATH);

    // Fast path: profile already confirmed and we're not on the setup page.
    // Skip the fetch entirely — no loading flash, no network call.
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

          // Read search string at execution time — not as a reactive dep.
          const rawSearch = typeof window !== "undefined" ? window.location.search : "";
          const rawQuery = rawSearch.startsWith("?") ? rawSearch.slice(1) : rawSearch;
          const nextPath = rawQuery ? `${pathname}?${rawQuery}` : pathname;
          if (active) {
            router.replace(`${PROFILE_PICTURE_SETUP_PATH}?next=${encodeURIComponent(nextPath)}`);
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
          const params =
            typeof window !== "undefined"
              ? new URLSearchParams(window.location.search)
              : new URLSearchParams();
          const candidateNext = params.get("next");
          const target = isAllowedNextPath(candidateNext)
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
      // Reset the in-flight flag so the next pathname-triggered effect can run.
      isCheckingRef.current = false;
    };
  }, [pathname, guardAttempt]);

  if (guardState === "error") {
    return (
      <div className="app-shell bg-transparent text-slate-900">
        <main className="app-shell-main min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl rounded-2xl border border-red-200 bg-white p-6">
            <p role="alert" className="text-sm font-medium text-red-700">
              {guardError ?? "Unable to verify profile picture."}
            </p>
            <button
              type="button"
              onClick={() => setGuardAttempt((value) => value + 1)}
              className={`${actionButtonStyles("secondary", "sm")} mt-4`}
            >
              Retry Profile Check
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (guardState !== "ready") {
    return (
      <div className="app-shell bg-transparent text-slate-900">
        <main className="app-shell-main min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl rounded-2xl border border-slate-200 bg-white p-6">
            <p role="status" aria-live="polite" className="text-sm text-slate-600">
              {guardState === "require_profile_picture"
                ? "Profile picture is required. Redirecting to setup..."
                : "Checking profile picture requirement..."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell bg-transparent text-slate-900">
      {mobileOpen ? (
        <div
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/30 transition-opacity lg:hidden"
        />
      ) : null}

      <ApplicantSidebar
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={`min-w-0 transition-[padding] duration-200 ${collapsed ? "lg:pl-20" : "lg:pl-72"}`}>
        <header className="app-header sticky top-0 z-30">
          <div className="flex min-h-[72px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
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
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">Applicant Portal</p>
                <h1 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">Welcome, {userName}</h1>
                <p className="truncate text-sm text-slate-600">Track applications, payments, and permit status.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationDropdown />
              <div className="hidden min-w-0 text-right sm:block">
                <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
                <p className="truncate text-xs text-slate-500">Applicant Portal</p>
              </div>
              {profileImageUrl && !profileImageFailed ? (
                <img
                  src={profileImageUrl}
                  alt={`${userName} profile picture`}
                  className="h-10 w-10 rounded-xl object-cover ring-1 ring-emerald-100 shadow-sm"
                  referrerPolicy="no-referrer"
                  onError={() => setProfileImageFailed(true)}
                />
              ) : (
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 shadow-sm">
                  <UserCircle2 className="h-5 w-5" />
                </span>
              )}
              <Link href="/applicant/profile" className={actionButtonStyles("secondary", "sm")}>
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

        <main className="app-shell-main min-w-0 px-4 pb-8 pt-5 sm:px-6 sm:pb-10 sm:pt-6 lg:px-8 lg:pb-12">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
