"use client";

import { useMemo, useState } from "react";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "lg";
  className?: string;
}

function joinClassNames(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function getInitials(name: string | null | undefined): string {
  const value = name?.trim() ?? "";
  if (!value) return "A";

  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function UserAvatar({ src, name, size = "sm", className }: UserAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const normalizedSrc = useMemo(() => {
    const value = src?.trim();
    return value ? value : null;
  }, [src]);

  const imageFailed = normalizedSrc !== null && failedSrc === normalizedSrc;

  const initials = getInitials(name);
  const sizeClassName = size === "lg" ? "h-32 w-32 text-3xl" : "h-8 w-8 text-xs";

  return (
    <div
      className={joinClassNames(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border-color)] bg-[var(--muted-surface)] font-semibold text-[var(--ink-muted)]",
        sizeClassName,
        className
      )}
      aria-label={name?.trim() ? `${name.trim()} avatar` : "Applicant avatar"}
    >
      {normalizedSrc && !imageFailed ? (
        <img
          src={normalizedSrc}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(normalizedSrc)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}