import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(),
  payment: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  application: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  applicationHistory: {
    create: vi.fn(),
  },
  activityLog: {
    create: vi.fn(),
  },
  permit: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
  },
  permitIssuance: {
    create: vi.fn(),
  },
  document: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/monitoring", () => ({
  captureException: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendPaymentConfirmationEmail: vi.fn(),
}));

vi.mock("@/lib/sse", () => ({
  broadcastPaymentInitiated: vi.fn(),
  broadcastDocumentVerified: vi.fn(),
  broadcastNotification: vi.fn(),
}));

vi.mock("@/lib/payments", () => ({
  calculateFees: vi.fn(() => ({ totalAmount: 1000, permitFee: 800, processingFee: 100, filingFee: 100 })),
  generateReceiptNumber: vi.fn(() => "OR-TEST-0001"),
  processPayment: vi.fn(),
  verifyPayMongoWebhook: vi.fn(),
}));

vi.mock("@/lib/pdf", () => ({
  buildPermitPDFData: vi.fn((data) => data),
  generatePermitPDF: vi.fn(async () => Buffer.from("%PDF-1.4\n")),
}));

vi.mock("@/lib/storage", () => ({
  generateStoragePath: vi.fn((applicationId: string, fileId: string, ext: string) => `documents/${applicationId}/${fileId}.${ext}`),
  scanForVirus: vi.fn(async () => ({ clean: true })),
  uploadFile: vi.fn(async () => ({ success: true, key: "documents/test.pdf" })),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimitPayment: vi.fn(() => ({ allowed: true, remaining: 4, resetAt: Date.now() + 60_000 })),
  rateLimitUpload: vi.fn(() => ({ allowed: true, remaining: 19, resetAt: Date.now() + 60_000 })),
  rateLimitAPI: vi.fn(() => ({ allowed: true, remaining: 99, resetAt: Date.now() + 60_000 })),
  rateLimitHeaders: vi.fn(() => ({})),
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

import { auth } from "@/lib/auth";
import { PATCH as patchPayment } from "@/app/api/payments/route";
import { POST as postPermit } from "@/app/api/permits/route";
import { GET as getPermitPdf } from "@/app/api/permits/[id]/pdf/route";
import { GET as publicTrack } from "@/app/api/public/track/route";
import { GET as publicVerifyPermit } from "@/app/api/public/verify-permit/route";
import { POST as uploadDocument } from "@/app/api/documents/upload/route";
import { POST as verifyDocument } from "@/app/api/documents/[id]/verify/route";
import { generatePermitPDF } from "@/lib/pdf";
import { uploadFile } from "@/lib/storage";

function jsonRequest(url: string, body: unknown, method = "POST") {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("payment route authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: any) => callback(prismaMock));
  });

  it("blocks applicants from verifying payments through PATCH /api/payments", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "applicant-1", role: "APPLICANT" } } as any);

    const response = await patchPayment(jsonRequest("http://localhost/api/payments", {
      paymentId: "pay-1",
      action: "VERIFY",
    }, "PATCH"));

    expect(response.status).toBe(403);
    expect(prismaMock.payment.update).not.toHaveBeenCalled();
  });

  it("allows BPLO_OFFICE to verify payment and moves application to PAID", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "bplo-1", role: "BPLO_OFFICE" } } as any);
    prismaMock.payment.findUnique.mockResolvedValue({
      id: "pay-1",
      applicationId: "app-1",
      status: "PENDING",
      metadata: {},
      receiptNumber: null,
      notes: null,
      application: { id: "app-1", status: "PAYMENT_PENDING", approvedAt: null },
    });
    prismaMock.payment.update.mockResolvedValue({ id: "pay-1", status: "PAID", amount: 1000 });

    const response = await patchPayment(jsonRequest("http://localhost/api/payments", {
      paymentId: "pay-1",
      action: "VERIFY",
      receiptNumber: "OR-1",
    }, "PATCH"));

    expect(response.status).toBe(200);
    expect(prismaMock.payment.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "pay-1" },
      data: expect.objectContaining({ status: "PAID" }),
    }));
    expect(prismaMock.application.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "app-1" },
      data: expect.objectContaining({ status: "PAID", paymentConfirmed: true }),
    }));
  });
});

describe("permit route authorization and PDF gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: any) => callback(prismaMock));
  });

  it("blocks applicants from generating permits through POST /api/permits", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "applicant-1", role: "APPLICANT" } } as any);

    const response = await postPermit(new NextRequest("http://localhost/api/permits", {
      method: "POST",
      body: JSON.stringify({ applicationId: "app-1" }),
    }));

    expect(response.status).toBe(403);
    expect(prismaMock.permit.create).not.toHaveBeenCalled();
  });

  it("blocks BPLO_OFFICE permit generation before application is PAID", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "bplo-1", role: "BPLO_OFFICE" } } as any);
    prismaMock.application.findUnique.mockResolvedValue({
      id: "app-1",
      status: "PAYMENT_PENDING",
      permit: null,
      applicant: { firstName: "Juan", lastName: "Dela Cruz" },
    });

    const response = await postPermit(new NextRequest("http://localhost/api/permits", {
      method: "POST",
      body: JSON.stringify({ applicationId: "app-1" }),
    }));

    expect(response.status).toBe(409);
    expect(prismaMock.permit.create).not.toHaveBeenCalled();
  });

  it("allows BPLO_OFFICE permit generation after application is PAID", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "bplo-1", role: "BPLO_OFFICE" } } as any);
    prismaMock.application.findUnique
      .mockResolvedValueOnce({
        id: "app-1",
        status: "PAID",
        permit: null,
        businessName: "Test Shop",
        businessAddress: "123 Test St",
        applicant: { firstName: "Juan", lastName: "Dela Cruz" },
      })
      .mockResolvedValueOnce({ status: "PAID" });
    prismaMock.permit.count.mockResolvedValue(0);
    prismaMock.permit.create.mockResolvedValue({ id: "permit-1", permitNumber: "BP-2026-000001" });
    prismaMock.permitIssuance.create.mockResolvedValue({ id: "issuance-1", status: "PREPARED" });
    prismaMock.application.update.mockResolvedValue({ id: "app-1", status: "PERMIT_PREPARED" });

    const response = await postPermit(new NextRequest("http://localhost/api/permits", {
      method: "POST",
      body: JSON.stringify({ applicationId: "app-1" }),
    }));

    expect(response.status).toBe(201);
    expect(prismaMock.permit.create).toHaveBeenCalled();
    expect(prismaMock.application.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "PERMIT_PREPARED" }),
    }));
  });

  it("blocks duplicate permit generation through POST /api/permits", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "bplo-1", role: "BPLO_OFFICE" } } as any);
    prismaMock.application.findUnique.mockResolvedValue({
      id: "app-1",
      status: "PAID",
      permit: { id: "existing-permit" },
      applicant: { firstName: "Juan", lastName: "Dela Cruz" },
    });

    const response = await postPermit(new NextRequest("http://localhost/api/permits", {
      method: "POST",
      body: JSON.stringify({ applicationId: "app-1" }),
    }));

    expect(response.status).toBe(409);
    expect(prismaMock.permit.create).not.toHaveBeenCalled();
  });

  it("blocks applicant permit PDF download before release", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "applicant-1", role: "APPLICANT" } } as any);
    prismaMock.permit.findUnique.mockResolvedValue({
      id: "permit-1",
      permitNumber: "BP-1",
      businessName: "Test Shop",
      businessAddress: "123 Test St",
      ownerName: "Juan Dela Cruz",
      issueDate: new Date(),
      expiryDate: new Date(),
      application: {
        applicantId: "applicant-1",
        status: "PERMIT_PREPARED",
        applicationNumber: "APP-1",
      },
      issuance: { status: "PREPARED" },
    });

    const response = await getPermitPdf(new Request("http://localhost/api/permits/permit-1/pdf"), params("permit-1"));

    expect(response.status).toBe(409);
    expect(generatePermitPDF).not.toHaveBeenCalled();
  });

  it("allows applicant permit PDF download only after release", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "applicant-1", role: "APPLICANT" } } as any);
    prismaMock.permit.findUnique.mockResolvedValue({
      id: "permit-1",
      permitNumber: "BP-1",
      businessName: "Test Shop",
      businessAddress: "123 Test St",
      ownerName: "Juan Dela Cruz",
      issueDate: new Date(),
      expiryDate: new Date(),
      application: {
        applicantId: "applicant-1",
        status: "RELEASED",
        applicationNumber: "APP-1",
      },
      issuance: { status: "RELEASED" },
    });

    const response = await getPermitPdf(new Request("http://localhost/api/permits/permit-1/pdf"), params("permit-1"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(generatePermitPDF).toHaveBeenCalled();
  });
});

describe("public route privacy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires application number plus verifier for /api/public/track", async () => {
    const response = await publicTrack(new Request("http://localhost/api/public/track?number=APP-1"));

    expect(response.status).toBe(400);
    expect(prismaMock.application.findUnique).not.toHaveBeenCalled();
  });

  it("does not expose applicant PII from /api/public/track", async () => {
    prismaMock.application.findFirst.mockResolvedValue({
      applicationNumber: "APP-1",
      businessName: "Test Shop",
      type: "NEW",
      status: "SUBMITTED",
      createdAt: new Date(),
      approvedAt: null,
      rejectedAt: null,
      applicant: { email: "owner@example.com", phone: "09171234567" },
      history: [],
    });

    const response = await publicTrack(new Request("http://localhost/api/public/track?number=APP-1&email=owner@example.com"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.application.applicant).toBeUndefined();
    expect(JSON.stringify(data)).not.toContain("owner@example.com");
    expect(JSON.stringify(data)).not.toContain("09171234567");
  });

  it("does not expose unreleased permits from /api/public/verify-permit", async () => {
    prismaMock.permit.findFirst.mockResolvedValue({
      permitNumber: "BP-1",
      businessName: "Test Shop",
      status: "ACTIVE",
      issueDate: new Date(),
      expiryDate: new Date(Date.now() + 86400000),
      application: { applicationNumber: "APP-1", type: "NEW", status: "PERMIT_PREPARED" },
      issuance: { status: "PREPARED" },
    });

    const response = await publicVerifyPermit(new Request("http://localhost/api/public/verify-permit?ref=BP-1"));

    expect(response.status).toBe(404);
  });

  it("returns only public permit data for released permits", async () => {
    prismaMock.permit.findFirst.mockResolvedValue({
      permitNumber: "BP-1",
      businessName: "Test Shop",
      status: "ACTIVE",
      issueDate: new Date(),
      expiryDate: new Date(Date.now() + 86400000),
      application: { applicationNumber: "APP-1", type: "NEW", status: "RELEASED" },
      issuance: { status: "RELEASED" },
    });

    const response = await publicVerifyPermit(new Request("http://localhost/api/public/verify-permit?ref=BP-1"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.permit.businessName).toBe("Test Shop");
    expect(data.permit.ownerName).toBeUndefined();
  });
});

describe("document upload and verification authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks applicant upload to another applicant's application", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "applicant-1", role: "APPLICANT" } } as any);
    prismaMock.application.findUnique.mockResolvedValue({
      id: "app-1",
      applicantId: "applicant-2",
      status: "DRAFT",
    });
    const formData = new FormData();
    formData.append("applicationId", "app-1");
    formData.append("documentTypes", "PROOF_OF_REGISTRATION");
    formData.append("files", new File([Buffer.from("%PDF")], "doc.pdf", { type: "application/pdf" }));

    const response = await uploadDocument({ formData: async () => formData } as unknown as Request);

    expect(response.status).toBe(403);
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it("rejects invalid MIME types through upload route", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "applicant-1", role: "APPLICANT" } } as any);
    prismaMock.application.findUnique.mockResolvedValue({
      id: "app-1",
      applicantId: "applicant-1",
      status: "DRAFT",
    });
    const formData = new FormData();
    formData.append("applicationId", "app-1");
    formData.append("documentTypes", "PROOF_OF_REGISTRATION");
    formData.append("files", new File(["bad"], "bad.txt", { type: "text/plain" }));

    const response = await uploadDocument({ formData: async () => formData } as unknown as Request);

    expect(response.status).toBe(400);
    expect(uploadFile).not.toHaveBeenCalled();
    expect(prismaMock.document.create).not.toHaveBeenCalled();
  });

  it("blocks applicants from verifying documents", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "applicant-1", role: "APPLICANT" } } as any);

    const response = await verifyDocument(jsonRequest("http://localhost/api/documents/doc-1/verify", {
      status: "VERIFIED",
    }), params("doc-1"));

    expect(response.status).toBe(403);
    expect(prismaMock.document.update).not.toHaveBeenCalled();
  });

  it("allows BPLO_OFFICE to verify documents", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "bplo-1", role: "BPLO_OFFICE" } } as any);
    prismaMock.document.findUnique.mockResolvedValue({
      id: "doc-1",
      applicationId: "app-1",
      originalName: "doc.pdf",
      application: { applicantId: "applicant-1" },
    });
    prismaMock.document.update.mockResolvedValue({ id: "doc-1", status: "VERIFIED" });
    prismaMock.document.count.mockResolvedValue(0);

    const response = await verifyDocument(jsonRequest("http://localhost/api/documents/doc-1/verify", {
      status: "VERIFIED",
    }), params("doc-1"));

    expect(response.status).toBe(200);
    expect(prismaMock.document.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "doc-1" },
      data: expect.objectContaining({ status: "VERIFIED", verifiedBy: "bplo-1" }),
    }));
    expect(prismaMock.application.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "app-1" },
      data: expect.objectContaining({ status: "UNDER_REVIEW", documentVerified: true }),
    }));
  });
});
