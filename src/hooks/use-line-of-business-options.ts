"use client";

import { useEffect, useState } from "react";
import { LINE_OF_BUSINESS_OPTIONS } from "@/lib/business-options";

/**
 * Loads Line of Business options (built-ins + Super Admin fee categories).
 * Falls back to built-in list while loading or if the request fails.
 */
export function useLineOfBusinessOptions(extraValues: Array<string | null | undefined> = []) {
  const [options, setOptions] = useState<string[]>([...LINE_OF_BUSINESS_OPTIONS]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/options/line-of-business", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { options?: unknown };
        if (!Array.isArray(json.options) || cancelled) return;
        const next = json.options
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .map((item) => item.trim());
        if (next.length > 0) setOptions(next);
      } catch {
        // Keep built-in fallback
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const merged = [...options];
  const seen = new Set(merged);
  for (const value of extraValues) {
    const trimmed = value?.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    merged.push(trimmed);
  }

  return merged;
}
