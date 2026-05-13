"use client";

import Link from "next/link";
import { Bell, PanelLeftClose, PanelLeftOpen, UserCircle2, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ApplicantSidebar } from "@/components/applicant/applicant-sidebar";
import { actionButtonStyles } from "@/components/ui/action-button";

export function ApplicantLayoutClient({
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
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Applicant Portal</p>
                <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">Welcome, {userName}</h1>
                <p className="truncate text-sm text-slate-500">Status-focused filing workspace</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600">
                <Bell className="h-4 w-4" />
              </span>
              <div className="hidden min-w-0 text-right sm:block">
                <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
                <p className="truncate text-xs text-slate-500">Applicant Portal</p>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <UserCircle2 className="h-5 w-5" />
              </span>
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

        <main className="app-shell-main min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
