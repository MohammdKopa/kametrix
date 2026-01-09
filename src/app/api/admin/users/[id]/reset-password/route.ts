import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import { hashPassword } from '@/lib/password';
import { headers } from 'next/headers';
import crypto from 'crypto';

// Force dynamic rendering since we use cookies() for authentication
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/users/[id]/reset-password - Reset user password (admin only)
 *
 * Body:
 * - newPassword?: string (optional, if not provided a random password is generated)
 * - forceLogout?: boolean (default true, logs user out of all sessions)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;

    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const body = await request.json().catch(() => ({}));
    const { newPassword, forceLogout = true } = body as {
      newPassword?: string;
      forceLogout?: boolean;
    };

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admin from resetting their own password through this endpoint
    if (admin.id === id) {
      return NextResponse.json(
        { error: 'Use the settings page to change your own password' },
        { status: 400 }
      );
    }

    // Generate password if not provided
    const password = newPassword || crypto.randomBytes(12).toString('base64').slice(0, 16);

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Update user password and record reset time
    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        lastPasswordReset: new Date(),
      },
    });

    // Log out user if requested
    if (forceLogout) {
      await prisma.session.deleteMany({ where: { userId: id } });
    }

    // Create audit log
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        targetUserId: id,
        action: 'USER_PASSWORD_RESET',
        description: `Reset password for ${currentUser.email}`,
        previousValue: Prisma.JsonNull,
        newValue: { passwordReset: true, forceLogout },
        ipAddress,
        userAgent,
      },
    });

    // Return the generated password only if it was auto-generated
    const response: { success: boolean; generatedPassword?: string; message: string } = {
      success: true,
      message: forceLogout
        ? 'Password reset successfully. User has been logged out of all sessions.'
        : 'Password reset successfully.',
    };

    if (!newPassword) {
      response.generatedPassword = password;
      response.message += ' A temporary password has been generated.';
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error resetting password:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
