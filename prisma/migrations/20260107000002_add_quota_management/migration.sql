-- Add API Rate Limiting & Quota Management Models
-- This migration adds comprehensive quota tracking and rate limiting:
-- - Per-user API quotas with configurable limits
-- - Detailed API usage logging for analytics
-- - Google Calendar specific quota management
-- - Quota alert system for monitoring

-- Create enums for quota management (with conditional creation)
DO $$ BEGIN
    CREATE TYPE "QuotaType" AS ENUM ('GOOGLE_CALENDAR', 'API_GENERAL', 'API_WEBHOOK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "QuotaPeriod" AS ENUM ('MINUTE', 'HOUR', 'DAY', 'MONTH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- API Quota tracking table
CREATE TABLE IF NOT EXISTS "ApiQuota" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quotaType" "QuotaType" NOT NULL,
    "period" "QuotaPeriod" NOT NULL,
    "maxRequests" INTEGER NOT NULL,
    "usedRequests" INTEGER NOT NULL DEFAULT 0,
    "periodStartAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastRequestAt" TIMESTAMP(3),
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockReason" TEXT,
    "blockExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiQuota_pkey" PRIMARY KEY ("id")
);

-- API Usage Log table for detailed tracking
CREATE TABLE IF NOT EXISTS "ApiUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "agentId" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "quotaType" "QuotaType" NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTimeMs" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiUsageLog_pkey" PRIMARY KEY ("id")
);

-- Google Calendar specific quota tracking
CREATE TABLE IF NOT EXISTS "GoogleCalendarQuota" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyRequestsUsed" INTEGER NOT NULL DEFAULT 0,
    "dailyRequestsLimit" INTEGER NOT NULL DEFAULT 1000000,
    "dailyResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userDailyLimit" INTEGER NOT NULL DEFAULT 10000,
    "userDailyUsed" INTEGER NOT NULL DEFAULT 0,
    "queriesPerMinute" INTEGER NOT NULL DEFAULT 60,
    "minuteWindowUsed" INTEGER NOT NULL DEFAULT 0,
    "minuteWindowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastRequestAt" TIMESTAMP(3),
    "consecutiveErrors" INTEGER NOT NULL DEFAULT 0,
    "lastErrorAt" TIMESTAMP(3),
    "isThrottled" BOOLEAN NOT NULL DEFAULT false,
    "throttleExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleCalendarQuota_pkey" PRIMARY KEY ("id")
);

-- Quota alerts for monitoring
CREATE TABLE IF NOT EXISTS "QuotaAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "quotaType" "QuotaType" NOT NULL,
    "alertType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "currentUsage" INTEGER NOT NULL,
    "maxAllowed" INTEGER NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotaAlert_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "ApiQuota_userId_quotaType_period_key" ON "ApiQuota"("userId", "quotaType", "period");
CREATE UNIQUE INDEX IF NOT EXISTS "GoogleCalendarQuota_userId_key" ON "GoogleCalendarQuota"("userId");

-- Indexes for ApiQuota
CREATE INDEX IF NOT EXISTS "ApiQuota_userId_idx" ON "ApiQuota"("userId");
CREATE INDEX IF NOT EXISTS "ApiQuota_quotaType_idx" ON "ApiQuota"("quotaType");
CREATE INDEX IF NOT EXISTS "ApiQuota_periodStartAt_idx" ON "ApiQuota"("periodStartAt");

-- Indexes for ApiUsageLog
CREATE INDEX IF NOT EXISTS "ApiUsageLog_userId_createdAt_idx" ON "ApiUsageLog"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "ApiUsageLog_endpoint_createdAt_idx" ON "ApiUsageLog"("endpoint", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "ApiUsageLog_quotaType_createdAt_idx" ON "ApiUsageLog"("quotaType", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "ApiUsageLog_createdAt_idx" ON "ApiUsageLog"("createdAt" DESC);

-- Indexes for GoogleCalendarQuota
CREATE INDEX IF NOT EXISTS "GoogleCalendarQuota_dailyResetAt_idx" ON "GoogleCalendarQuota"("dailyResetAt");
CREATE INDEX IF NOT EXISTS "GoogleCalendarQuota_isThrottled_idx" ON "GoogleCalendarQuota"("isThrottled");

-- Indexes for QuotaAlert
CREATE INDEX IF NOT EXISTS "QuotaAlert_userId_createdAt_idx" ON "QuotaAlert"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "QuotaAlert_quotaType_acknowledged_idx" ON "QuotaAlert"("quotaType", "acknowledged");
CREATE INDEX IF NOT EXISTS "QuotaAlert_createdAt_idx" ON "QuotaAlert"("createdAt" DESC);

-- Foreign key constraints
ALTER TABLE "ApiQuota" DROP CONSTRAINT IF EXISTS "ApiQuota_userId_fkey";
ALTER TABLE "ApiQuota" ADD CONSTRAINT "ApiQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApiUsageLog" DROP CONSTRAINT IF EXISTS "ApiUsageLog_userId_fkey";
ALTER TABLE "ApiUsageLog" ADD CONSTRAINT "ApiUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ApiUsageLog" DROP CONSTRAINT IF EXISTS "ApiUsageLog_agentId_fkey";
ALTER TABLE "ApiUsageLog" ADD CONSTRAINT "ApiUsageLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GoogleCalendarQuota" DROP CONSTRAINT IF EXISTS "GoogleCalendarQuota_userId_fkey";
ALTER TABLE "GoogleCalendarQuota" ADD CONSTRAINT "GoogleCalendarQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuotaAlert" DROP CONSTRAINT IF EXISTS "QuotaAlert_userId_fkey";
ALTER TABLE "QuotaAlert" ADD CONSTRAINT "QuotaAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
