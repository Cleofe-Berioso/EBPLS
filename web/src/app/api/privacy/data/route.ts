/**
 * Data Privacy API — RA 10173 Compliance
 * Right to access personal data
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/privacy/data - Export all personal data (Right to Access)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Gather all personal data
    const [user, applications, documents, activityLogs] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          middleName: true,
          phone: true,
          role: true,
          status: true,
          emailVerified: true,
          twoFactorEnabled: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.application.findMany({
        where: { applicantId: userId },
        include: {
          history: true,
          reviewActions: { select: { action: true, comment: true, createdAt: true } },
        },
      }),
      prisma.document.findMany({
        where: { uploadedBy: userId },
        select: {
          id: true,
          originalName: true,
          documentType: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      dataSubject: user,
      applications,
      documents,
      activityLogs,
      notice: 'This data export is provided in compliance with Republic Act No. 10173 (Data Privacy Act of 2012). For questions, contact our Data Protection Officer.',
    };

    // Log the data export request
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'DATA_EXPORT_REQUEST',
        entity: 'User',
        entityId: userId,
      },
    });

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}

// DELETE /api/privacy/data - Request data deletion (Right to Erasure)
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if user has active applications (cannot delete with active permits)
    const activeApplications = await prisma.application.count({
      where: {
        applicantId: userId,
        status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
      },
    });

    if (activeApplications > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete account with pending applications. Please wait for processing to complete or cancel your applications first.',
          activeApplications,
        },
        { status: 400 }
      );
    }

    // Mark account for deletion (soft delete — admin reviews within 30 days per RA 10173)
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'INACTIVE',
        // Anonymize PII
        firstName: 'DELETED',
        lastName: 'USER',
        middleName: null,
        phone: null,
        avatar: null,
        twoFactorSecret: null,
        twoFactorEnabled: false,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'DATA_DELETION_REQUEST',
        entity: 'User',
        entityId: userId,
        details: {
          reason: 'User requested account deletion under RA 10173',
          scheduledPurgeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    });

    return NextResponse.json({
      message: 'Account scheduled for deletion. Your personal data will be purged within 30 days as required by RA 10173. Active permits remain valid until expiry per government records retention policy.',
      scheduledPurgeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Data deletion error:', error);
    return NextResponse.json({ error: 'Failed to process deletion request' }, { status: 500 });
  }
}
