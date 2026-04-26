/**
 * Permit Print Workflow API Route
 * POST /api/permits/{id}/print - Record permit printing
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const printPermitSchema = z.object({
  quantity: z.number().int().min(1).max(10).default(1),
  notes: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only BPLO_OFFICE can print permits
    if (session.user.role !== 'BPLO_OFFICE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // Validate input
    const validatedData = printPermitSchema.parse(body);

    // Fetch permit
    const permit = await prisma.permit.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            applicant: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
        },
        issuance: true,
      },
    });

    if (!permit) {
      return NextResponse.json({ error: 'Permit not found' }, { status: 404 });
    }

    // Check permit status
    if (permit.status === 'EXPIRED') {
      return NextResponse.json(
        { error: 'Cannot print expired permits' },
        { status: 400 }
      );
    }

    if (permit.status === 'REVOKED') {
      return NextResponse.json(
        { error: 'Cannot print revoked permits' },
        { status: 400 }
      );
    }

    if (!permit.issuance) {
      return NextResponse.json(
        { error: 'Permit must be prepared before printing' },
        { status: 409 }
      );
    }

    const updatedIssuance = await prisma.permitIssuance.update({
      where: { id: permit.issuance.id },
      data: {
        staffNotes: validatedData.notes || permit.issuance.staffNotes,
      },
    });

    // Update permit (just updating the updatedAt timestamp)
    const updatedPermit = await prisma.permit.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
      include: {
        application: true,
        issuance: true,
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'PERMIT_PRINTED',
        entity: 'Permit',
        entityId: permit.id,
        details: {
          permitNumber: permit.permitNumber,
          quantity: validatedData.quantity,
          notes: validatedData.notes,
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Permit printed successfully',
        permit: {
          id: updatedPermit.id,
          permitNumber: updatedPermit.permitNumber,
          status: updatedPermit.status,
        },
        issuance: {
          id: updatedIssuance.id,
          status: updatedIssuance.status,
          completedAt: updatedIssuance.completedAt?.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Permit print error:', error);
    return NextResponse.json(
      { error: 'Failed to record permit print' },
      { status: 500 }
    );
  }
}
