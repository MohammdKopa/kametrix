import type { Role } from '@/generated/prisma/client';

/**
 * Authenticated user data (without sensitive fields)
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  creditBalance: number;
  graceCreditsUsed: number;
  googleConnectedAt: Date | null;
  googleSheetId: string | null;
}

/**
 * Session user (User from Prisma without passwordHash)
 */
export type SessionUser = Omit<{
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  role: Role;
  creditBalance: number;
  graceCreditsUsed: number;
  createdAt: Date;
  updatedAt: Date;
}, 'passwordHash'>;
