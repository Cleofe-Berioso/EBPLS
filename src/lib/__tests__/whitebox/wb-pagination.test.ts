import { describe, expect, it } from "vitest";
import {
  PAGINATION_PAGE_SIZES,
  DEFAULT_PAGE_SIZE,
  clampPage,
  clampPageSize,
  resolvePagination,
  buildPaginatedResult,
  mergeSearchParams,
} from "@/lib/pagination";

describe("WB-PAGE — pagination helpers", () => {
  it("WB-PAGE-01 clampPage coerces invalid to 1", () => {
    expect(clampPage("3")).toBe(3);
    expect(clampPage(0)).toBe(1);
    expect(clampPage(null)).toBe(1);
    expect(clampPage("abc")).toBe(1);
  });

  it("WB-PAGE-02 clampPageSize only allows 10/25/50", () => {
    expect(clampPageSize(10)).toBe(10);
    expect(clampPageSize(15)).toBe(DEFAULT_PAGE_SIZE);
    expect(PAGINATION_PAGE_SIZES).toEqual([10, 25, 50]);
  });

  it("WB-PAGE-03 resolvePagination computes skip/take", () => {
    expect(resolvePagination({ page: 2, pageSize: 10 })).toEqual({
      page: 2,
      pageSize: 10,
      skip: 10,
      take: 10,
    });
  });

  it("WB-PAGE-04 buildPaginatedResult clamps page and empty totals", () => {
    const empty = buildPaginatedResult([], 0, 5, 25);
    expect(empty.totalPages).toBe(1);
    expect(empty.page).toBe(1);
    const page = buildPaginatedResult([1, 2], 100, 99, 10);
    expect(page.totalPages).toBe(10);
    expect(page.page).toBe(10);
  });

  it("WB-PAGE-05 mergeSearchParams omits default page/pageSize", () => {
    const q = mergeSearchParams({ q: "x" }, { page: 1, pageSize: 25, status: "OPEN" });
    expect(q).toContain("status=OPEN");
    expect(q).not.toContain("page=");
    expect(q).not.toContain("pageSize=");
  });
});
