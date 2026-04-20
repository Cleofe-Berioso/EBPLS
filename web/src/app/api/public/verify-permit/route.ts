/**
 * GET /api/public/verify-permit?ref={permitNumber}
 * P6.0 Phase E: Public Permit Verification
 *
 * Allow public lookup of permit validity by permit number
 * Supports QR code scanning
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const permitNumber = searchParams.get("ref");

    if (!permitNumber) {
      return NextResponse.json(
        { error: "Permit number is required" },
        { status: 400 }
      );
    }

    // Find permit by number or reference (permit number validation for public verification)
    const permit = await prisma.permit.findFirst({
      where: { permitNumber },
      include: {
        application: {
          select: {
            id: true,
            applicationNumber: true,
            type: true,
            status: true,
          },
        },
      },
    });

    if (!permit) {
      return NextResponse.json(
        { error: "Permit not found" },
        { status: 404 }
      );
    }

    // Check permit validity
    const now = new Date();
    const expiryDate = new Date(permit.expiryDate);
    const isValid = permit.status === "ACTIVE" && expiryDate > now;

    // Calculate days until expiry
    const daysToExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Format response for public disclosure (sanitize personal details)
    return NextResponse.json(
      {
        verified: true,
        permitNumber: permit.permitNumber,
        status: permit.status,
        permit: {
          permitNumber: permit.permitNumber,
          businessName: permit.businessName,
          permitStatus: permit.status,
          isValid,
          issuedDate: permit.issueDate?.toISOString(),
          expiryDate: permit.expiryDate?.toISOString(),
          daysToExpiry: isValid ? daysToExpiry : 0,
        },
        application: {
          applicationNumber: permit.application.applicationNumber,
          applicationType: permit.application.type,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Public permit verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify permit" },
      { status: 500 }
    );
  }
}
