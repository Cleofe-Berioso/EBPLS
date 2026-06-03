"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [imageFailed, setImageFailed] = useState(false);

  const normalizedSrc = useMemo(() => {
    const value = src?.trim();
    return value ? value : null;
  }, [src]);

  useEffect(() => {
    setImageFailed(false);
  }, [normalizedSrc]);

  const initials = getInitials(name);
  const sizeClassName = size === "lg" ? "h-32 w-32 text-3xl" : "h-8 w-8 text-xs";

  return (
    <div
      className={joinClassNames(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 font-semibold text-slate-600",
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
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}