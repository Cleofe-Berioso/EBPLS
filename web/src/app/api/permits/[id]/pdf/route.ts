/**
 * Permit PDF Generation & Download API
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generatePermitPDF, buildPermitPDFData } from '@/lib/pdf';
import { canApplicantDownloadPermit } from '@/lib/workflow';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const permit = await prisma.permit.findUnique({
      where: { id },
      include: {
        application: {
          include: { applicant: true },
        },
        issuance: true,
      },
    });

    if (!permit) {
      return NextResponse.json({ error: 'Permit not found' }, { status: 404 });
    }

    if (session.user.role !== 'APPLICANT' && session.user.role !== 'BPLO_OFFICE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (session.user.role === 'APPLICANT') {
      if (permit.application.applicantId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const issuanceStatus = permit.issuance?.status;
      const issuanceAllowsDownload =
        issuanceStatus === 'ISSUED' ||
        issuanceStatus === 'RELEASED' ||
        issuanceStatus === 'COMPLETED';

      if (!canApplicantDownloadPermit(permit.application.status) || !issuanceAllowsDownload) {
        return NextResponse.json(
          { error: 'Permit PDF is not available for applicant download yet' },
          { status: 409 }
        );
      }
    }

    // Build PDF data
    const pdfData = buildPermitPDFData({
      permitNumber: permit.permitNumber,
      businessName: permit.businessName,
      businessAddress: permit.businessAddress,
      ownerName: permit.ownerName,
      issueDate: permit.issueDate,
      expiryDate: permit.expiryDate,
      application: {
        applicationNumber: permit.application.applicationNumber,
        businessType: permit.application.businessType,
        tinNumber: permit.application.tinNumber,
        dtiSecRegistration: permit.application.dtiSecRegistration,
      },
    });

    const pdfBuffer = await generatePermitPDF(pdfData);

    // Log download
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'PERMIT_PDF_DOWNLOADED',
        entity: 'Permit',
        entityId: permit.id,
      },
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="permit-${permit.permitNumber}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Permit PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate permit PDF' }, { status: 500 });
  }
}
