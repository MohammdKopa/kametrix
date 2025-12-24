import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/phone-numbers - List all phone numbers (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: {
      status?: 'AVAILABLE' | 'ASSIGNED' | 'RELEASED';
    } = {};

    if (status && ['AVAILABLE', 'ASSIGNED', 'RELEASED'].includes(status)) {
      where.status = status as 'AVAILABLE' | 'ASSIGNED' | 'RELEASED';
    }

    const [phoneNumbers, total] = await Promise.all([
      prisma.phoneNumber.findMany({
        where,
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.phoneNumber.count({ where }),
    ]);

    return NextResponse.json({
      phoneNumbers,
      total,
      page,
      limit,
      hasMore: skip + phoneNumbers.length < total,
    });
  } catch (error) {
    console.error('Error fetching phone numbers:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch phone numbers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/phone-numbers - Add a new phone number (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { number, twilioSid, vapiPhoneId } = body;

    if (!number) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate E.164 format
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(number)) {
      return NextResponse.json(
        { error: 'Phone number must be in E.164 format (e.g., +14155551234)' },
        { status: 400 }
      );
    }

    // Check if number already exists
    const existing = await prisma.phoneNumber.findUnique({
      where: { number },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Phone number already exists' },
        { status: 409 }
      );
    }

    const phoneNumber = await prisma.phoneNumber.create({
      data: {
        number,
        twilioSid: twilioSid || null,
        vapiPhoneId: vapiPhoneId || null,
        status: 'AVAILABLE',
      },
    });

    return NextResponse.json({ phoneNumber }, { status: 201 });
  } catch (error) {
    console.error('Error creating phone number:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to create phone number' },
      { status: 500 }
    );
  }
}
