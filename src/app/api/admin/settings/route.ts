import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { getCentsPerMinute, setCentsPerMinute } from '@/lib/settings';

/**
 * GET /api/admin/settings - Get current admin settings
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const centsPerMinute = await getCentsPerMinute();

    return NextResponse.json({
      centsPerMinute,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings - Update admin settings
 */
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { centsPerMinute } = body;

    // Validate centsPerMinute
    if (centsPerMinute === undefined) {
      return NextResponse.json(
        { error: 'centsPerMinute is required' },
        { status: 400 }
      );
    }

    if (typeof centsPerMinute !== 'number') {
      return NextResponse.json(
        { error: 'centsPerMinute must be a number' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(centsPerMinute)) {
      return NextResponse.json(
        { error: 'centsPerMinute must be an integer' },
        { status: 400 }
      );
    }

    if (centsPerMinute < 1 || centsPerMinute > 1000) {
      return NextResponse.json(
        { error: 'centsPerMinute must be between 1 and 1000' },
        { status: 400 }
      );
    }

    await setCentsPerMinute(centsPerMinute);

    return NextResponse.json({
      centsPerMinute,
      message: 'Settings updated',
    });
  } catch (error) {
    console.error('Error updating settings:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
