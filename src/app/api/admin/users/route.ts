import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import type { Role, UserStatus, Prisma } from '@/generated/prisma/client';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users - List all users (admin only)
 *
 * Query params:
 * - search: string - Search by email, name, or username
 * - role: Role - Filter by role
 * - status: UserStatus - Filter by status
 * - page: number - Page number (default 1)
 * - limit: number - Items per page (default 20)
 * - sortBy: string - Sort field (default createdAt)
 * - sortOrder: 'asc' | 'desc' - Sort order (default desc)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') as Role | null;
    const statusFilter = searchParams.get('status') as UserStatus | null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const skip = (page - 1) * limit;

    // Build where clause
    const whereConditions: Prisma.UserWhereInput[] = [];

    if (search) {
      whereConditions.push({
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (roleFilter) {
      whereConditions.push({ role: roleFilter });
    }

    if (statusFilter) {
      whereConditions.push({ status: statusFilter });
    }

    const where: Prisma.UserWhereInput =
      whereConditions.length > 0 ? { AND: whereConditions } : {};

    // Build orderBy clause
    const validSortFields = ['createdAt', 'email', 'name', 'role', 'status', 'creditBalance'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderBy = { [orderByField]: sortOrder };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          role: true,
          status: true,
          creditBalance: true,
          createdAt: true,
          updatedAt: true,
          deactivatedAt: true,
          lastPasswordReset: true,
          _count: {
            select: {
              agents: true,
              calls: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      limit,
      hasMore: skip + users.length < total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching users:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
