import Link from "next/link";
import { actionButtonStyles } from "@/components/ui/action-button";
import {
  DEFAULT_PAGE_SIZE,
  PAGINATION_PAGE_SIZES,
  type PaginationPageSize,
} from "@/lib/pagination";

interface PaginationControlsProps {
  basePath: string;
  queryParams: Record<string, string | undefined | null>;
  page: number;
  pageSize: PaginationPageSize;
  totalCount: number;
  totalPages: number;
  recordLabel?: string;
  sortHint?: string;
  /** Client mode: use form/onChange instead of Link navigation */
  mode?: "link" | "client";
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: PaginationPageSize) => void;
  pageParamKey?: string;
}

function buildHref(
  basePath: string,
  queryParams: Record<string, string | undefined | null>,
  overrides: Record<string, string | number | null | undefined>,
  pageParamKey = "page"
): string {
  const nextParams = new URLSearchParams();
  const merged = { ...queryParams, ...overrides };

  for (const [key, value] of Object.entries(merged)) {
    if (value == null || value === "") continue;
    if (key === pageParamKey && String(value) === "1") continue;
    if (key === "pageSize" && String(value) === String(DEFAULT_PAGE_SIZE)) continue;
    nextParams.set(key, String(value));
  }

  const query = nextParams.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function PaginationControls({
  basePath,
  queryParams,
  page,
  pageSize,
  totalCount,
  totalPages,
  recordLabel = "records",
  sortHint,
  mode = "link",
  isLoading = false,
  onPageChange,
  onPageSizeChange,
  pageParamKey = "page",
}: PaginationControlsProps) {
  if (totalCount === 0) {
    return null;
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);
  const disabledClass = isLoading ? "pointer-events-none opacity-50" : "";
  const pageIndicatorClass =
    "inline-flex min-h-10 items-center rounded-[var(--radius-control)] border border-[var(--border-color)] bg-[var(--muted-surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)]";

  return (
    <section
      className="app-surface flex flex-col gap-2.5 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:px-6"
      aria-label="Pagination"
    >
      <div>
        <p className="text-sm font-medium text-[var(--foreground)]">
          Showing {start}-{end} of {totalCount} {recordLabel}
        </p>
        {sortHint ? <p className="ui-caption mt-0.5">{sortHint}</p> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs font-medium text-[var(--ink-muted)]">
          <span>Rows</span>
          {mode === "client" ? (
            <select
              aria-label="Page size"
              value={pageSize}
              disabled={isLoading}
              onChange={(event) => onPageSizeChange?.(Number(event.target.value) as PaginationPageSize)}
              className="ui-control-select"
            >
              {PAGINATION_PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          ) : (
            <select
              aria-label="Page size"
              value={String(pageSize)}
              disabled={isLoading}
              className="ui-control-select"
              onChange={(event) => {
                const nextSize = event.target.value;
                window.location.href = buildHref(basePath, queryParams, {
                  pageSize: nextSize,
                  [pageParamKey]: "1",
                }, pageParamKey);
              }}
            >
              {PAGINATION_PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          )}
        </label>

        {mode === "client" ? (
          <>
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => onPageChange?.(page - 1)}
              className={`${actionButtonStyles("secondary", "sm")} ${page <= 1 || isLoading ? "pointer-events-none opacity-50" : ""}`}
            >
              Previous
            </button>
            <span className={pageIndicatorClass}>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => onPageChange?.(page + 1)}
              className={`${actionButtonStyles("secondary", "sm")} ${page >= totalPages || isLoading ? "pointer-events-none opacity-50" : ""}`}
            >
              Next
            </button>
          </>
        ) : (
          <>
            {page > 1 ? (
              <Link
                href={buildHref(basePath, queryParams, { [pageParamKey]: String(page - 1), pageSize: String(pageSize) }, pageParamKey)}
                className={`${actionButtonStyles("secondary", "sm")} ${disabledClass}`}
                aria-disabled={isLoading}
              >
                Previous
              </Link>
            ) : (
              <span className={`${actionButtonStyles("secondary", "sm")} pointer-events-none opacity-50`}>
                Previous
              </span>
            )}
            <span className={pageIndicatorClass}>
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={buildHref(basePath, queryParams, { [pageParamKey]: String(page + 1), pageSize: String(pageSize) }, pageParamKey)}
                className={`${actionButtonStyles("secondary", "sm")} ${disabledClass}`}
                aria-disabled={isLoading}
              >
                Next
              </Link>
            ) : (
              <span className={`${actionButtonStyles("secondary", "sm")} pointer-events-none opacity-50`}>
                Next
              </span>
            )}
          </>
        )}
      </div>
    </section>
  );
}
