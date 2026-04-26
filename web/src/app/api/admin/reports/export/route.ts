import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v).replace(/"/g, '""');
    return `"${s}"`;
  };
  return [
    headers.map(escape).join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\r\n");
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "applications";
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined;
  const dateFilter = from || to ? { createdAt: { ...(from && { gte: from }), ...(to && { lte: to }) } } : {};

  let csv = "";
  let filename = "report.csv";

  if (type === "applications") {
    const rows = await prisma.application.findMany({
      where: dateFilter,
      orderBy: { createdAt: "desc" },
      select: {
        applicationNumber: true,
        businessName: true,
        businessType: true,
        type: true,
        status: true,
        createdAt: true,
        approvedAt: true,
        rejectedAt: true,
        applicantId: true,
        applicant: { select: { email: true, firstName: true, lastName: true } },
      },
    });
    csv = toCsv(
      rows.map((r) => ({
        "Application #": r.applicationNumber,
        "Business Name": r.businessName,
        "Business Type": r.businessType,
        "Application Type": r.type,
        Status: r.status,
        "Applicant Name": `${r.applicant.firstName} ${r.applicant.lastName}`,
        "Applicant Email": r.applicant.email,
        "Submitted At": r.createdAt.toISOString(),
        "Approved At": r.approvedAt?.toISOString() ?? "",
        "Rejected At": r.rejectedAt?.toISOString() ?? "",
      }))
    );
    filename = "applications-report.csv";
  } else if (type === "users") {
    const rows = await prisma.user.findMany({
      where: dateFilter,
      orderBy: { createdAt: "desc" },
      select: {
        email: true, firstName: true, lastName: true,
        role: true, status: true, lastLoginAt: true, createdAt: true,
        _count: { select: { applications: true } },
      },
    });
    csv = toCsv(
      rows.map((r) => ({
        Email: r.email,
        "First Name": r.firstName,
        "Last Name": r.lastName,
        Role: r.role,
        Status: r.status,
        "Total Applications": r._count.applications,
        "Last Login": r.lastLoginAt?.toISOString() ?? "Never",
        "Registered At": r.createdAt.toISOString(),
      }))
    );
    filename = "users-report.csv";
  } else if (type === "permits") {
    const rows = await prisma.permit.findMany({
      where: dateFilter,
      orderBy: { createdAt: "desc" },
      select: {
        permitNumber: true, businessName: true, businessAddress: true,
        ownerName: true, status: true, issueDate: true, expiryDate: true,
      },
    });
    csv = toCsv(
      rows.map((r) => ({
        "Permit #": r.permitNumber,
        "Business Name": r.businessName,
        "Business Address": r.businessAddress,
        "Owner Name": r.ownerName,
        Status: r.status,
        "Issue Date": r.issueDate.toISOString(),
        "Expiry Date": r.expiryDate.toISOString(),
      }))
    );
    filename = "permits-report.csv";
  } else if (type === "audit") {
    const rows = await prisma.activityLog.findMany({
      where: dateFilter,
      orderBy: { createdAt: "desc" },
      take: 5000,
      select: {
        action: true, entity: true, entityId: true,
        createdAt: true, ipAddress: true,
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    });
    csv = toCsv(
      rows.map((r) => ({
        Action: r.action,
        Entity: r.entity,
        "Entity ID": r.entityId ?? "",
        "User Email": r.user?.email ?? "System",
        "User Name": r.user ? `${r.user.firstName} ${r.user.lastName}` : "System",
        "IP Address": r.ipAddress ?? "",
        Timestamp: r.createdAt.toISOString(),
      }))
    );    filename = "audit-log.csv";
  } else if (type === "payments") {
    const rows = await prisma.payment.findMany({
      where: dateFilter,
      orderBy: { createdAt: "desc" },
      select: {
        transactionId: true,
        receiptNumber: true,
        amount: true,
        method: true,
        status: true,
        paidAt: true,
        createdAt: true,
        application: { select: { applicationNumber: true, businessName: true } },
        payer: { select: { email: true, firstName: true, lastName: true } },
      },
    });
    csv = toCsv(
      rows.map((r) => ({
        "Transaction ID": r.transactionId ?? "",
        "Receipt #": r.receiptNumber ?? "",
        "Application #": r.application.applicationNumber,
        "Business Name": r.application.businessName,
        "Payer Name": `${r.payer.firstName} ${r.payer.lastName}`,
        "Payer Email": r.payer.email,
        "Amount": Number(r.amount).toFixed(2),
        "Method": r.method,
        "Status": r.status,
        "Paid At": r.paidAt?.toISOString() ?? "",
        "Created At": r.createdAt.toISOString(),
      }))
    );
    filename = "payments-report.csv";
  } else {
    return NextResponse.json({ error: "Invalid report type. Use: applications, users, permits, payments, audit" }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
