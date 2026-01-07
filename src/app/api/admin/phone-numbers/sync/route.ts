import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { listPhoneNumbers } from '@/lib/vapi/phone-numbers';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/phone-numbers/sync - Sync phone numbers from Vapi to local DB (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    // Fetch all phone numbers from Vapi
    const vapiPhones = await listPhoneNumbers();

    // Create a Set of Vapi phone IDs for quick lookup
    const vapiPhoneIds = new Set(vapiPhones.map((p) => p.id));

    let added = 0;
    let updated = 0;
    let released = 0;

    // Process each Vapi phone number
    for (const vapiPhone of vapiPhones) {
      // If Vapi phone is assigned to an assistant, find our local agent
      let agentId: string | null = null;
      if (vapiPhone.assistantId) {
        const agent = await prisma.agent.findFirst({
          where: { vapiAssistantId: vapiPhone.assistantId },
        });
        agentId = agent?.id || null;
      }

      // Check if phone number exists in our DB by vapiPhoneId
      const existingPhone = await prisma.phoneNumber.findUnique({
        where: { vapiPhoneId: vapiPhone.id },
      });

      if (existingPhone) {
        // Update existing phone number
        const shouldBeAssigned = !!vapiPhone.assistantId && !!agentId;

        // Only update if there's a change
        if (
          existingPhone.number !== vapiPhone.number ||
          existingPhone.agentId !== agentId ||
          (shouldBeAssigned && existingPhone.status !== 'ASSIGNED') ||
          (!shouldBeAssigned && existingPhone.status === 'ASSIGNED')
        ) {
          await prisma.phoneNumber.update({
            where: { id: existingPhone.id },
            data: {
              number: vapiPhone.number,
              agentId: agentId,
              status: shouldBeAssigned ? 'ASSIGNED' : 'AVAILABLE',
            },
          });
          updated++;
        }
      } else {
        // Check if this number already exists (by phone number, not vapiPhoneId)
        const existingByNumber = await prisma.phoneNumber.findUnique({
          where: { number: vapiPhone.number },
        });

        const shouldBeAssigned = !!vapiPhone.assistantId && !!agentId;

        if (existingByNumber) {
          // Number exists but doesn't have vapiPhoneId - update it
          await prisma.phoneNumber.update({
            where: { id: existingByNumber.id },
            data: {
              vapiPhoneId: vapiPhone.id,
              agentId: agentId,
              status: shouldBeAssigned ? 'ASSIGNED' : 'AVAILABLE',
            },
          });
          updated++;
        } else {
          // Create new phone number
          await prisma.phoneNumber.create({
            data: {
              number: vapiPhone.number,
              vapiPhoneId: vapiPhone.id,
              agentId: agentId,
              status: shouldBeAssigned ? 'ASSIGNED' : 'AVAILABLE',
            },
          });
          added++;
        }
      }
    }

    // Find phone numbers in DB that are no longer in Vapi
    const allDbPhones = await prisma.phoneNumber.findMany({
      where: {
        vapiPhoneId: { not: null },
      },
    });

    for (const dbPhone of allDbPhones) {
      if (dbPhone.vapiPhoneId && !vapiPhoneIds.has(dbPhone.vapiPhoneId)) {
        // Phone number was removed from Vapi - mark as RELEASED
        if (dbPhone.status !== 'RELEASED') {
          await prisma.phoneNumber.update({
            where: { id: dbPhone.id },
            data: { status: 'RELEASED' },
          });
          released++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        added,
        updated,
        released,
        total: vapiPhones.length,
      },
    });
  } catch (error) {
    console.error('Error syncing phone numbers:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to sync phone numbers' },
      { status: 500 }
    );
  }
}
