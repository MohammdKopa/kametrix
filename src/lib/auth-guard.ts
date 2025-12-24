import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionFromCookies, validateSession } from './auth';
import type { AuthUser } from '@/types';

/**
 * Get the authenticated user from the request
 * @param request - Next request
 * @returns AuthUser or null if not authenticated
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = getSessionFromCookies(cookieStore);

    if (!token) {
      return null;
    }

    const sessionData = await validateSession(token);
    if (!sessionData) {
      return null;
    }

    const { user } = sessionData;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      creditBalance: user.creditBalance,
    };
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
}

/**
 * Require authentication for a request
 * @param request - Next request
 * @returns AuthUser
 * @throws Error if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getAuthUser(request);

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Require admin authentication for a request
 * @param request - Next request
 * @returns AuthUser
 * @throws Error if not authenticated or not admin
 */
export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request);

  if (user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }

  return user;
}
