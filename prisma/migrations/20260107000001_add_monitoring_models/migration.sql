-- Add Monitoring & Analytics Models
-- This migration adds production monitoring capabilities including:
-- - Health checks and uptime monitoring
-- - Performance metrics persistence
-- - User analytics tracking
-- - Anomaly detection and alerting

-- Create new enums for monitoring
CREATE TYPE "MetricType" AS ENUM ('COUNTER', 'GAUGE', 'HISTOGRAM', 'TIMING');
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED');
CREATE TYPE "ServiceStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'UNHEALTHY', 'UNKNOWN');
CREATE TYPE "CalendarSyncStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- Add calendar fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "calendarSyncEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "defaultTimezone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastCalendarSync" TIMESTAMP(3);

-- Add calendar fields to Agent table
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "primaryCalendarId" TEXT;
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "checkCalendarIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "defaultTimezone" TEXT;

-- Add session security fields
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "browserFingerprint" TEXT;
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "csrfToken" TEXT;

-- Add AI analysis fields to Call table
ALTER TABLE "Call" ADD COLUMN IF NOT EXISTS "sentiment" TEXT;
ALTER TABLE "Call" ADD COLUMN IF NOT EXISTS "sentimentScore" DOUBLE PRECISION;
ALTER TABLE "Call" ADD COLUMN IF NOT EXISTS "keyTopics" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Call" ADD COLUMN IF NOT EXISTS "customerIntents" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Call" ADD COLUMN IF NOT EXISTS "actionItems" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Call" ADD COLUMN IF NOT EXISTS "followUpRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Call" ADD COLUMN IF NOT EXISTS "analysisJson" JSONB;

-- Calendar Events table
CREATE TABLE IF NOT EXISTS "CalendarEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "googleEventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "attendees" JSONB,
    "createdByAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- Calendar Sync Log table
CREATE TABLE IF NOT EXISTS "CalendarSyncLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventsCreated" INTEGER NOT NULL DEFAULT 0,
    "eventsUpdated" INTEGER NOT NULL DEFAULT 0,
    "eventsDeleted" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarSyncLog_pkey" PRIMARY KEY ("id")
);

-- Calendar Sync Queue table
CREATE TABLE IF NOT EXISTS "CalendarSyncQueue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "CalendarSyncStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarSyncQueue_pkey" PRIMARY KEY ("id")
);

-- System Metrics table for persistent metrics storage
CREATE TABLE IF NOT EXISTS "SystemMetric" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MetricType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "tags" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemMetric_pkey" PRIMARY KEY ("id")
);

-- Uptime monitoring records
CREATE TABLE IF NOT EXISTS "UptimeRecord" (
    "id" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "status" "ServiceStatus" NOT NULL,
    "responseTimeMs" INTEGER,
    "errorMessage" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UptimeRecord_pkey" PRIMARY KEY ("id")
);

-- User analytics tracking
CREATE TABLE IF NOT EXISTS "UserAnalytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "totalCallsPlaced" INTEGER NOT NULL DEFAULT 0,
    "totalCallDuration" INTEGER NOT NULL DEFAULT 0,
    "totalCreditsUsed" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAnalytics_pkey" PRIMARY KEY ("id")
);

-- Event log for user activity
CREATE TABLE IF NOT EXISTS "EventLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- Monitoring alerts
CREATE TABLE IF NOT EXISTS "MonitoringAlert" (
    "id" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "metadata" JSONB,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "MonitoringAlert_pkey" PRIMARY KEY ("id")
);

-- Metric aggregates for dashboard
CREATE TABLE IF NOT EXISTS "MetricAggregate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "sum" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "min" DOUBLE PRECISION,
    "max" DOUBLE PRECISION,
    "avg" DOUBLE PRECISION,
    "p50" DOUBLE PRECISION,
    "p95" DOUBLE PRECISION,
    "p99" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricAggregate_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "CalendarEvent_userId_googleEventId_key" ON "CalendarEvent"("userId", "googleEventId");
CREATE UNIQUE INDEX IF NOT EXISTS "UserAnalytics_userId_key" ON "UserAnalytics"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "MetricAggregate_name_period_periodKey_key" ON "MetricAggregate"("name", "period", "periodKey");

-- Indexes for CalendarEvent
CREATE INDEX IF NOT EXISTS "CalendarEvent_startTime_idx" ON "CalendarEvent"("startTime");
CREATE INDEX IF NOT EXISTS "CalendarEvent_userId_startTime_idx" ON "CalendarEvent"("userId", "startTime");

-- Indexes for CalendarSyncLog
CREATE INDEX IF NOT EXISTS "CalendarSyncLog_userId_createdAt_idx" ON "CalendarSyncLog"("userId", "createdAt");

-- Indexes for CalendarSyncQueue
CREATE INDEX IF NOT EXISTS "CalendarSyncQueue_status_idx" ON "CalendarSyncQueue"("status");
CREATE INDEX IF NOT EXISTS "CalendarSyncQueue_userId_status_idx" ON "CalendarSyncQueue"("userId", "status");

-- Indexes for SystemMetric
CREATE INDEX IF NOT EXISTS "SystemMetric_name_recordedAt_idx" ON "SystemMetric"("name", "recordedAt" DESC);
CREATE INDEX IF NOT EXISTS "SystemMetric_recordedAt_idx" ON "SystemMetric"("recordedAt" DESC);

-- Indexes for UptimeRecord
CREATE INDEX IF NOT EXISTS "UptimeRecord_serviceName_checkedAt_idx" ON "UptimeRecord"("serviceName", "checkedAt" DESC);
CREATE INDEX IF NOT EXISTS "UptimeRecord_checkedAt_idx" ON "UptimeRecord"("checkedAt" DESC);

-- Indexes for UserAnalytics
CREATE INDEX IF NOT EXISTS "UserAnalytics_lastActiveAt_idx" ON "UserAnalytics"("lastActiveAt" DESC);
CREATE INDEX IF NOT EXISTS "UserAnalytics_userId_idx" ON "UserAnalytics"("userId");

-- Indexes for EventLog
CREATE INDEX IF NOT EXISTS "EventLog_userId_createdAt_idx" ON "EventLog"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "EventLog_eventType_createdAt_idx" ON "EventLog"("eventType", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "EventLog_createdAt_idx" ON "EventLog"("createdAt" DESC);

-- Indexes for MonitoringAlert
CREATE INDEX IF NOT EXISTS "MonitoringAlert_status_severity_idx" ON "MonitoringAlert"("status", "severity");
CREATE INDEX IF NOT EXISTS "MonitoringAlert_triggeredAt_idx" ON "MonitoringAlert"("triggeredAt" DESC);
CREATE INDEX IF NOT EXISTS "MonitoringAlert_source_status_idx" ON "MonitoringAlert"("source", "status");

-- Indexes for MetricAggregate
CREATE INDEX IF NOT EXISTS "MetricAggregate_name_periodKey_idx" ON "MetricAggregate"("name", "periodKey" DESC);

-- Foreign key constraints for Calendar tables
ALTER TABLE "CalendarEvent" DROP CONSTRAINT IF EXISTS "CalendarEvent_userId_fkey";
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CalendarEvent" DROP CONSTRAINT IF EXISTS "CalendarEvent_createdByAgent_fkey";
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_createdByAgent_fkey" FOREIGN KEY ("createdByAgent") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CalendarSyncLog" DROP CONSTRAINT IF EXISTS "CalendarSyncLog_userId_fkey";
ALTER TABLE "CalendarSyncLog" ADD CONSTRAINT "CalendarSyncLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CalendarSyncQueue" DROP CONSTRAINT IF EXISTS "CalendarSyncQueue_userId_fkey";
ALTER TABLE "CalendarSyncQueue" ADD CONSTRAINT "CalendarSyncQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
