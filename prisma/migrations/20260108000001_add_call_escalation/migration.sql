-- Add Call Escalation & Forwarding Models
-- This migration adds comprehensive call escalation functionality:
-- - Extended CallStatus enum with ESCALATED and TRANSFERRED states
-- - EscalationReason enum for categorizing escalation triggers
-- - EscalationStatus enum for tracking transfer progress
-- - Escalation fields on Call model for tracking escalated calls
-- - EscalationConfig model for agent-specific escalation settings
-- - EscalationLog model for detailed escalation analytics

-- Add new values to CallStatus enum
DO $$ BEGIN
    ALTER TYPE "CallStatus" ADD VALUE IF NOT EXISTS 'ESCALATED';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE "CallStatus" ADD VALUE IF NOT EXISTS 'TRANSFERRED';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create EscalationReason enum
DO $$ BEGIN
    CREATE TYPE "EscalationReason" AS ENUM (
        'USER_REQUEST',
        'LOW_CONFIDENCE',
        'REPEATED_CLARIFICATION',
        'UNRECOGNIZED_INTENT',
        'COMPLEX_ISSUE',
        'SENTIMENT_NEGATIVE',
        'MAX_DURATION',
        'EXPLICIT_TRIGGER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create EscalationStatus enum
DO $$ BEGIN
    CREATE TYPE "EscalationStatus" AS ENUM (
        'PENDING',
        'IN_QUEUE',
        'CONNECTED',
        'FAILED',
        'NO_OPERATORS',
        'TIMEOUT',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add escalation fields to Call table
ALTER TABLE "Call" ADD COLUMN IF NOT EXISTS "escalatedAt" TIMESTAMP(3);
ALTER TABLE "Call" ADD COLUMN IF NOT EXISTS "escalationReason" "EscalationReason";
ALTER TABLE "Call" ADD COLUMN IF NOT EXISTS "escalationStatus" "EscalationStatus";
ALTER TABLE "Call" ADD COLUMN IF NOT EXISTS "escalatedToNumber" TEXT;
ALTER TABLE "Call" ADD COLUMN IF NOT EXISTS "escalationNotes" TEXT;
ALTER TABLE "Call" ADD COLUMN IF NOT EXISTS "transferAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Call" ADD COLUMN IF NOT EXISTS "humanConnectedAt" TIMESTAMP(3);
ALTER TABLE "Call" ADD COLUMN IF NOT EXISTS "escalationMetadata" JSONB;

-- Create EscalationConfig table for agent-specific escalation settings
CREATE TABLE IF NOT EXISTS "EscalationConfig" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,

    -- Enable/disable escalation
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    -- Primary forwarding destination
    "forwardingNumber" TEXT,
    "forwardingQueue" TEXT,
    "forwardingDepartment" TEXT,

    -- Fallback options
    "fallbackNumber" TEXT,
    "voicemailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "voicemailGreeting" TEXT,

    -- Business hours routing
    "businessHoursStart" TEXT,
    "businessHoursEnd" TEXT,
    "businessDays" TEXT[] DEFAULT ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    "afterHoursNumber" TEXT,
    "afterHoursMessage" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Berlin',

    -- Escalation triggers
    "maxCallDuration" INTEGER NOT NULL DEFAULT 300,
    "maxClarifications" INTEGER NOT NULL DEFAULT 3,
    "sentimentThreshold" DOUBLE PRECISION NOT NULL DEFAULT -0.5,

    -- Custom trigger phrases (JSON array of strings)
    "triggerPhrases" JSONB NOT NULL DEFAULT '[]',

    -- Transfer settings
    "maxTransferWaitTime" INTEGER NOT NULL DEFAULT 60,
    "announceTransfer" BOOLEAN NOT NULL DEFAULT true,
    "transferMessage" TEXT,
    "holdMusicUrl" TEXT,

    -- Context sharing
    "shareTranscript" BOOLEAN NOT NULL DEFAULT true,
    "shareSummary" BOOLEAN NOT NULL DEFAULT true,
    "shareCallerInfo" BOOLEAN NOT NULL DEFAULT true,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscalationConfig_pkey" PRIMARY KEY ("id")
);

-- Create EscalationLog table for detailed escalation tracking and analytics
CREATE TABLE IF NOT EXISTS "EscalationLog" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    -- Escalation details
    "reason" "EscalationReason" NOT NULL,
    "status" "EscalationStatus" NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Transfer details
    "transferNumber" TEXT,
    "transferQueue" TEXT,
    "transferAttempts" INTEGER NOT NULL DEFAULT 1,
    "transferStartedAt" TIMESTAMP(3),
    "transferCompletedAt" TIMESTAMP(3),
    "waitTimeSeconds" INTEGER,

    -- Context captured
    "conversationSummary" TEXT,
    "lastAiMessage" TEXT,
    "lastUserMessage" TEXT,
    "callerSentiment" TEXT,
    "sentimentScore" DOUBLE PRECISION,
    "clarificationCount" INTEGER NOT NULL DEFAULT 0,
    "callDurationAtEscalation" INTEGER,

    -- Outcome tracking
    "humanConnectedAt" TIMESTAMP(3),
    "humanAgentId" TEXT,
    "resolutionNotes" TEXT,
    "wasResolved" BOOLEAN,
    "customerSatisfied" BOOLEAN,

    -- Failure details
    "failureReason" TEXT,
    "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "voicemailLeft" BOOLEAN NOT NULL DEFAULT false,

    -- Additional metadata
    "metadata" JSONB,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscalationLog_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "EscalationConfig_agentId_key" ON "EscalationConfig"("agentId");
CREATE UNIQUE INDEX IF NOT EXISTS "EscalationLog_callId_key" ON "EscalationLog"("callId");

-- Indexes for EscalationConfig
CREATE INDEX IF NOT EXISTS "EscalationConfig_agentId_idx" ON "EscalationConfig"("agentId");

-- Indexes for EscalationLog
CREATE INDEX IF NOT EXISTS "EscalationLog_agentId_idx" ON "EscalationLog"("agentId");
CREATE INDEX IF NOT EXISTS "EscalationLog_userId_idx" ON "EscalationLog"("userId");
CREATE INDEX IF NOT EXISTS "EscalationLog_reason_idx" ON "EscalationLog"("reason");
CREATE INDEX IF NOT EXISTS "EscalationLog_status_idx" ON "EscalationLog"("status");
CREATE INDEX IF NOT EXISTS "EscalationLog_triggeredAt_idx" ON "EscalationLog"("triggeredAt" DESC);
CREATE INDEX IF NOT EXISTS "EscalationLog_userId_triggeredAt_idx" ON "EscalationLog"("userId", "triggeredAt" DESC);
CREATE INDEX IF NOT EXISTS "EscalationLog_agentId_triggeredAt_idx" ON "EscalationLog"("agentId", "triggeredAt" DESC);

-- Indexes for Call escalation fields
CREATE INDEX IF NOT EXISTS "Call_escalatedAt_idx" ON "Call"("escalatedAt" DESC);
CREATE INDEX IF NOT EXISTS "Call_escalationReason_idx" ON "Call"("escalationReason");
CREATE INDEX IF NOT EXISTS "Call_escalationStatus_idx" ON "Call"("escalationStatus");

-- Foreign key constraints
ALTER TABLE "EscalationConfig" DROP CONSTRAINT IF EXISTS "EscalationConfig_agentId_fkey";
ALTER TABLE "EscalationConfig" ADD CONSTRAINT "EscalationConfig_agentId_fkey"
    FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EscalationLog" DROP CONSTRAINT IF EXISTS "EscalationLog_callId_fkey";
ALTER TABLE "EscalationLog" ADD CONSTRAINT "EscalationLog_callId_fkey"
    FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Note: We don't add FK constraints for agentId and userId in EscalationLog
-- to allow historical data to remain even if agents/users are deleted
