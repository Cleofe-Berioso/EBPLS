"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, Menu, User, ChevronDown } from "lucide-react";
import type { Role } from "@prisma/client";
import { NotificationBell } from "@/components/dashboard/notification-bell";

interface HeaderProps {
  user: {
    firstName: string;
    lastName: string;
    email?: string | null;
    role: Role;
  };
  /** Called when the hamburger button is pressed on mobile */
  onMenuClick?: () => void;
}

export function DashboardHeader({ user, onMenuClick }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 shadow-sm sm:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — visible only on mobile */}
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 hover:bg-muted lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
        </button>
        <h2 className="text-base font-semibold text-foreground sm:text-lg lg:hidden">
          Business Permit System
        </h2>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications — live bell with SSE */}
        <NotificationBell />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted sm:px-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {user.role.toLowerCase().replace("_", " ")}
              </p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
          </button>

          {showUserMenu && (
            <>
              {/* Click-away backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-border bg-popover py-2 shadow-lg">
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="h-4 w-4" />
                  My Profile
                </Link>
                <hr className="my-1 border-border" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
