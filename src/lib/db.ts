// NOTE: Import will error until prisma generate is run after schema is defined (Plan 01-02)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - Prisma client not generated yet
import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
