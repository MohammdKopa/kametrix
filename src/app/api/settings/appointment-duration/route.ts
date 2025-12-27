import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

/**
 * PUT /api/settings/appointment-duration
 *
 * Update the user's appointment duration setting
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { duration } = body;

    // Validate duration
    const validDurations = [15, 30, 45, 60, 90, 120];
    if (!validDurations.includes(duration)) {
      return NextResponse.json(
        { error: 'Invalid duration. Valid options: 15, 30, 45, 60, 90, 120 minutes' },
        { status: 400 }
      );
    }

    // Update user's appointment duration
    await prisma.user.update({
      where: { id: user.id },
      data: { appointmentDuration: duration },
    });

    return NextResponse.json({ success: true, duration });
  } catch (error) {
    console.error('Error updating appointment duration:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment duration' },
      { status: 500 }
    );
  }
}
