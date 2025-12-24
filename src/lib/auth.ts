import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Session, User } from '@/generated/prisma/client';

const SESSION_DURATION_DAYS = 7;
const COOKIE_NAME = 'session';

/**
 * Generate a secure random session token
 * @returns Session token
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a new session for a user
 * @param userId - User ID
 * @returns Session with token
 */
export async function createSession(userId: string): Promise<Session> {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const session = await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return session;
}

/**
 * Validate a session token and return user and session
 * @param token - Session token
 * @returns User and session or null if invalid
 */
export async function validateSession(token: string): Promise<{ user: User; session: Session } | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  // Check if session is expired
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return {
    user: session.user,
    session,
  };
}

/**
 * Invalidate a session
 * @param token - Session token
 */
export async function invalidateSession(token: string): Promise<void> {
  await prisma.session.delete({
    where: { token },
  }).catch(() => {
    // Ignore if session doesn't exist
  });
}

/**
 * Get session token from cookies
 * @param cookieStore - Request cookies
 * @returns Session token or null
 */
export function getSessionFromCookies(cookieStore: ReadonlyRequestCookies): string | null {
  const cookie = cookieStore.get(COOKIE_NAME);
  return cookie?.value ?? null;
}

/**
 * Set session cookie in response
 * @param response - Next response
 * @param token - Session token
 * @param expiresAt - Expiration date
 */
export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

/**
 * Clear session cookie from response
 * @param response - Next response
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
