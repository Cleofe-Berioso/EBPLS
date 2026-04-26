import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    auth: (handler: unknown) => handler,
  })),
}));

vi.mock("@/lib/auth.config", () => ({
  authConfig: {},
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 99, resetAt: Date.now() + 60_000 })),
  getClientIp: vi.fn(() => "127.0.0.1"),
  rateLimitHeaders: vi.fn(() => ({})),
}));

import { handleMiddleware } from "@/middleware";

function requestFor(pathname: string, role?: "APPLICANT" | "BPLO_OFFICE" | "ADMIN") {
  return {
    nextUrl: new URL(`http://localhost${pathname}`),
    url: `http://localhost${pathname}`,
    headers: new Headers(),
    auth: role ? { user: { role } } : null,
  } as any;
}

describe("middleware dashboard route protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows APPLICANT to access /dashboard/payments", () => {
    const response = handleMiddleware(requestFor("/dashboard/payments", "APPLICANT"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("blocks APPLICANT from /dashboard/validate-payments", () => {
    const response = handleMiddleware(requestFor("/dashboard/validate-payments", "APPLICANT"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("allows BPLO_OFFICE to access /dashboard/validate-payments", () => {
    const response = handleMiddleware(requestFor("/dashboard/validate-payments", "BPLO_OFFICE"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("allows ADMIN to access /dashboard/admin/users", () => {
    const response = handleMiddleware(requestFor("/dashboard/admin/users", "ADMIN"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("blocks BPLO_OFFICE from /dashboard/admin/users", () => {
    const response = handleMiddleware(requestFor("/dashboard/admin/users", "BPLO_OFFICE"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("redirects unauthenticated users from protected dashboard routes", () => {
    const response = handleMiddleware(requestFor("/dashboard/payments"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/login?callbackUrl=%2Fdashboard%2Fpayments");
  });
});
