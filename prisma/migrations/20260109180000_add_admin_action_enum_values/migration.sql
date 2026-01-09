-- AlterEnum: Add new values to AdminAction enum
-- This adds comprehensive admin action tracking for agents, phones, system, and compliance

-- Add user management actions
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'BULK_DELETE';

-- Add agent management actions
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'AGENT_CREATE';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'AGENT_UPDATE';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'AGENT_DELETE';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'AGENT_TOGGLE_STATUS';

-- Add phone number management actions
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'PHONE_ASSIGN';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'PHONE_RELEASE';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'PHONE_SYNC';

-- Add system configuration actions
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'SETTINGS_UPDATE';

-- Add access & security actions
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'ADMIN_LOGIN';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'ADMIN_LOGOUT';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'ACCESS_DENIED';

-- Add compliance & reporting actions
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'AUDIT_EXPORT';
ALTER TYPE "AdminAction" ADD VALUE IF NOT EXISTS 'COMPLIANCE_REPORT';
