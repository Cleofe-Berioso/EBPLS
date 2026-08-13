export const PAGINATION_PAGE_SIZES = [10, 25, 50] as const;

export type PaginationPageSize = (typeof PAGINATION_PAGE_SIZES)[number];

export const DEFAULT_PAGE_SIZE: PaginationPageSize = 25;

export interface PaginatedResult<T> {
  records: T[];
  totalCount: number;
  page: number;
  pageSize: PaginationPageSize;
  totalPages: number;
}

export function clampPage(value?: number | string | null): number {
  const parsed =
    typeof value === "string" ? Number.parseInt(value, 10) : typeof value === "number" ? value : 1;
  if (!parsed || Number.isNaN(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

export function clampPageSize(value?: number | string | null): PaginationPageSize {
  const parsed =
    typeof value === "string" ? Number.parseInt(value, 10) : typeof value === "number" ? value : DEFAULT_PAGE_SIZE;
  if (PAGINATION_PAGE_SIZES.includes(parsed as PaginationPageSize)) {
    return parsed as PaginationPageSize;
  }
  return DEFAULT_PAGE_SIZE;
}

export function resolvePagination(input?: { page?: number | string | null; pageSize?: number | string | null }) {
  const page = clampPage(input?.page);
  const pageSize = clampPageSize(input?.pageSize);
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function buildPaginatedResult<T>(
  records: T[],
  totalCount: number,
  page: number,
  pageSize: PaginationPageSize
): PaginatedResult<T> {
  const totalPages = totalCount === 0 ? 1 : Math.ceil(totalCount / pageSize);
  return {
    records,
    totalCount,
    page: Math.min(page, totalPages),
    pageSize,
    totalPages,
  };
}

export function mergeSearchParams(
  current: Record<string, string | undefined | null>,
  overrides: Record<string, string | number | null | undefined>
): string {
  const nextParams = new URLSearchParams();

  const merged = { ...current, ...overrides };

  for (const [key, value] of Object.entries(merged)) {
    if (value == null || value === "") continue;
    if (key === "page" && String(value) === "1") continue;
    if (key === "pageSize" && String(value) === String(DEFAULT_PAGE_SIZE)) continue;
    nextParams.set(key, String(value));
  }

  const query = nextParams.toString();
  return query;
}
