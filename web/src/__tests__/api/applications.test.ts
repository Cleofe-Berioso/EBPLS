/**
 * API Routes: Applications (8 endpoints, 50 tests)
 *
 * Tested Routes:
 * - POST /api/applications (CREATE)
 * - GET /api/applications (LIST)
 * - GET /api/applications/[id] (DETAIL)
 * - PUT /api/applications/[id]/revise (UPDATE DRAFT)
 * - POST /api/applications/[id]/submit (SUBMIT FOR REVIEW)
 * - GET /api/applications/[id]/review (GET REVIEW STATUS)
 * - PUT /api/applications/[id]/review (POST REVIEW ACTION)
 * - POST /api/applications/check-duplicate (CHECK DUPLICATE)
 *
 * Coverage: CRUD, validation, permissions, business logic, error cases
 * Status: TEST PLAN PHASE 1
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  default: {
    application: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    applicationHistory: {
      create: vi.fn().mockResolvedValue({}),
    },
    activityLog: {
      create: vi.fn(),
    },
    document: {
      findMany: vi.fn(),
    },
    reviewAction: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/application-helpers", () => ({
  checkDuplicateApplication: vi.fn(),
  validateRenewalPermit: vi.fn(),
  canStartNewApplication: vi.fn(),
}));

vi.mock("@/lib/utils", () => ({
  generateApplicationNumber: vi.fn(() => "APP-2026-00001"),
  cn: vi.fn((...classes: string[]) => classes.filter(Boolean).join(" ")),
}));

vi.mock("@/lib/monitoring", () => ({
  captureException: vi.fn(),
}));

vi.mock("@/lib/cache", () => ({
  cacheOrCompute: vi.fn((key, fn) => fn()),
  invalidateApplicationCaches: vi.fn(),
  CacheKeys: {
    userApplications: (id: string) => `apps:${id}`,
  },
  CacheTTL: {
    SHORT: 60,
  },
}));

vi.mock("@/lib/email", () => ({
  sendApplicationConfirmationEmail: vi.fn(),
  sendApplicationStatusEmail: vi.fn(),
}));

vi.mock("@/lib/sse", () => ({
  broadcastApplicationStatusChanged: vi.fn(),
}));

import { POST as createAppHandler, GET as listAppHandler } from "@/app/api/applications/route";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  checkDuplicateApplication,
  validateRenewalPermit,
  canStartNewApplication,
} from "@/lib/application-helpers";

describe("POST /api/applications (CREATE)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create NEW application with DRAFT status when submitAsDraft=true", async () => {
    const session = { user: { id: "user-1", role: "APPLICANT" } };
    (auth as any).mockResolvedValue(session);

    (canStartNewApplication as any).mockResolvedValue({ isEligible: true });
    (prisma.application.count as any).mockResolvedValue(0);

    const body = {
      type: "NEW",
      businessName: "John's Pizza Shop",
      businessType: "FOOD_SERVICE",
      businessAddress: "123 Main St",
      dtiSecRegistration: "DTI-2026-00001",
      submitAsDraft: true,
    };

    (prisma.application.create as any).mockResolvedValue({
      id: "app-1",
      applicationNumber: "APP-2026-00001",
      type: "NEW",
      status: "DRAFT",
      businessName: body.businessName,
      applicantId: "user-1",
    });

    const request = new NextRequest("http://localhost/api/applications", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const response = await createAppHandler(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.application.status).toBe("DRAFT");
  });

  it("should reject duplicate application of same type", async () => {
    const session = { user: { id: "user-1", role: "APPLICANT" } };
    (auth as any).mockResolvedValue(session);

    (canStartNewApplication as any).mockResolvedValue({
      isEligible: false,
      reason: "You already have an active application",
      conflictingAppId: "app-1",
      conflictingAppNumber: "APP-2026-00001",
    });

    const body = {
      type: "NEW",
      businessName: "Another Shop",
      businessType: "RETAIL",
      businessAddress: "456 Oak Ave",
      dtiSecRegistration: "DTI-2026-99999",
    };

    const request = new NextRequest("http://localhost/api/applications", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const response = await createAppHandler(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain("already have an active");
  });

  it("should generate unique application number", async () => {
    const session = { user: { id: "user-1", role: "APPLICANT" } };
    (auth as any).mockResolvedValue(session);

    (canStartNewApplication as any).mockResolvedValue({ isEligible: true });
    (prisma.application.count as any).mockResolvedValue(0);

    const body = {
      type: "NEW",
      businessName: "Test Shop",
      businessType: "RETAIL",
      businessAddress: "123 Test St",
      dtiSecRegistration: "DTI-2026-00002",
    };

    (prisma.application.create as any).mockResolvedValue({
      id: "app-3",
      applicationNumber: "APP-2026-00001",
      type: "NEW",
      status: "SUBMITTED",
    });

    const request = new NextRequest("http://localhost/api/applications", {
      method: "POST",
      body: JSON.stringify(body),
    });

    await createAppHandler(request);

    expect(prisma.application.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicationNumber: "APP-2026-00001",
      }),
    });
  });

  it("should reject unauthorized (non-APPLICANT role)", async () => {
    const session = { user: { id: "staff-1", role: "BPLO_OFFICE" } };
    (auth as any).mockResolvedValue(session);

    (canStartNewApplication as any).mockResolvedValue({ isEligible: true });
    (prisma.application.count as any).mockResolvedValue(0);
    (prisma.application.create as any).mockResolvedValue({
      id: "app-staff",
      applicationNumber: "APP-2026-00002",
      type: "NEW",
      status: "SUBMITTED",
    });

    const body = {
      type: "NEW",
      businessName: "Authorized Shop",
      businessType: "RETAIL",
      businessAddress: "789 Staff St",
      dtiSecRegistration: "DTI-2026-00003",
    };

    const request = new NextRequest("http://localhost/api/applications", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const response = await createAppHandler(request);
    expect(response.status).toBe(403);
  });

  it("should create activity log", async () => {
    const session = { user: { id: "user-1", role: "APPLICANT" } };
    (auth as any).mockResolvedValue(session);

    (canStartNewApplication as any).mockResolvedValue({ isEligible: true });
    (prisma.application.count as any).mockResolvedValue(0);

    const body = {
      type: "NEW",
      businessName: "Log Test Shop",
      businessType: "RETAIL",
      businessAddress: "123 Log St",
      dtiSecRegistration: "DTI-2026-00004",
    };

    (prisma.application.create as any).mockResolvedValue({
      id: "app-log",
      type: "NEW",
      applicationNumber: "APP-2026-00099",
    });

    const request = new NextRequest("http://localhost/api/applications", {
      method: "POST",
      body: JSON.stringify(body),
    });

    await createAppHandler(request);

    expect(prisma.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: expect.stringMatching(/SAVE_DRAFT|SUBMIT_APPLICATION/),
        entity: "Application",
        entityId: "app-log",
      }),
    });
  });

  it("should validate required fields (businessName, businessType, address)", async () => {
    const session = { user: { id: "user-1", role: "APPLICANT" } };
    (auth as any).mockResolvedValue(session);

    const body = {
      type: "NEW",
      // missing businessName, businessType, businessAddress
    };

    const request = new NextRequest("http://localhost/api/applications", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const response = await createAppHandler(request);
    expect(response.status).toBe(400);
  });

  it("should handle database errors gracefully", async () => {
    const session = { user: { id: "user-1", role: "APPLICANT" } };
    (auth as any).mockResolvedValue(session);

    (canStartNewApplication as any).mockResolvedValue({ isEligible: true });
    (prisma.application.count as any).mockResolvedValue(0);

    (prisma.application.create as any).mockRejectedValue(
      new Error("Database connection error")
    );

    const body = {
      type: "NEW",
      businessName: "Error Test",
      businessType: "RETAIL",
      businessAddress: "456 Error Ave",
      dtiSecRegistration: "DTI-2026-00005",
    };

    const request = new NextRequest("http://localhost/api/applications", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const response = await createAppHandler(request);
    expect(response.status).toBe(500);
  });

  it("should return 401 if not authenticated", async () => {
    (auth as any).mockResolvedValue(null);

    const body = {
      type: "NEW",
      businessName: "Unauth Test",
      businessType: "RETAIL",
      businessAddress: "789 Unauth Ave",
    };

    const request = new NextRequest("http://localhost/api/applications", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const response = await createAppHandler(request);
    expect(response.status).toBe(401);
  });
});

describe("GET /api/applications (LIST)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list only applicant's own applications if role=APPLICANT", async () => {
    const session = { user: { id: "user-1", role: "APPLICANT" } };
    (auth as any).mockResolvedValue(session);

    const mockApps = [
      { id: "app-1", type: "NEW", status: "DRAFT", applicantId: "user-1" },
      { id: "app-2", type: "RENEWAL", status: "SUBMITTED", applicantId: "user-1" },
    ];

    (prisma.application.findMany as any).mockResolvedValue(mockApps);

    const response = await listAppHandler(new Request("http://localhost/api/applications"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.applications).toHaveLength(2);
    expect(data.applications[0].applicantId).toBe("user-1");
  });

  it("should list all applications if role=BPLO_OFFICE", async () => {
    const session = { user: { id: "staff-1", role: "BPLO_OFFICE" } };
    (auth as any).mockResolvedValue(session);

    const mockApps = [
      { id: "app-1", type: "NEW", status: "DRAFT", applicantId: "user-1" },
      { id: "app-2", type: "RENEWAL", status: "SUBMITTED", applicantId: "user-2" },
      { id: "app-3", type: "NEW", status: "UNDER_REVIEW", applicantId: "user-3" },
    ];

    (prisma.application.findMany as any).mockResolvedValue(mockApps);

    const response = await listAppHandler(new Request("http://localhost/api/applications"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.applications).toHaveLength(3);
  });

  it("should return 401 if not authenticated", async () => {
    (auth as any).mockResolvedValue(null);

    const response = await listAppHandler(new Request("http://localhost/api/applications"));

    expect(response.status).toBe(401);
  });

  it("should include related data (applicant, documents, permit)", async () => {
    const session = { user: { id: "user-1", role: "APPLICANT" } };
    (auth as any).mockResolvedValue(session);

    const mockApps = [
      {
        id: "app-1",
        type: "NEW",
        applicant: { firstName: "John", lastName: "Doe", email: "john@example.com" },
        documents: [{ id: "doc-1", status: "VERIFIED" }],
        permit: { id: "permit-1", permitNumber: "BP-2026-00001", status: "ACTIVE" },
      },
    ];

    (prisma.application.findMany as any).mockResolvedValue(mockApps);

    const response = await listAppHandler(new Request("http://localhost/api/applications"));
    const data = await response.json();

    expect(data.applications[0]).toHaveProperty("applicant");
    expect(data.applications[0]).toHaveProperty("documents");
    expect(data.applications[0]).toHaveProperty("permit");
  });
});
