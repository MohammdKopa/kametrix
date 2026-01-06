-- Performance Optimization Indexes Migration
-- Adds indexes for frequently queried columns to improve query performance

-- Call table indexes for filtering and sorting
CREATE INDEX IF NOT EXISTS "Call_userId_idx" ON "Call"("userId");
CREATE INDEX IF NOT EXISTS "Call_agentId_idx" ON "Call"("agentId");
CREATE INDEX IF NOT EXISTS "Call_status_idx" ON "Call"("status");
CREATE INDEX IF NOT EXISTS "Call_startedAt_idx" ON "Call"("startedAt" DESC);
CREATE INDEX IF NOT EXISTS "Call_userId_startedAt_idx" ON "Call"("userId", "startedAt" DESC);
CREATE INDEX IF NOT EXISTS "Call_userId_status_idx" ON "Call"("userId", "status");

-- CreditTransaction indexes for transaction history queries
CREATE INDEX IF NOT EXISTS "CreditTransaction_userId_idx" ON "CreditTransaction"("userId");
CREATE INDEX IF NOT EXISTS "CreditTransaction_createdAt_idx" ON "CreditTransaction"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "CreditTransaction_userId_createdAt_idx" ON "CreditTransaction"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "CreditTransaction_type_idx" ON "CreditTransaction"("type");

-- Agent table indexes
CREATE INDEX IF NOT EXISTS "Agent_userId_idx" ON "Agent"("userId");
CREATE INDEX IF NOT EXISTS "Agent_isActive_idx" ON "Agent"("isActive");
CREATE INDEX IF NOT EXISTS "Agent_userId_isActive_idx" ON "Agent"("userId", "isActive");
CREATE INDEX IF NOT EXISTS "Agent_createdAt_idx" ON "Agent"("createdAt" DESC);

-- Session table indexes for auth lookups
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON "Session"("expiresAt");

-- User table indexes
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt" DESC);

-- PhoneNumber indexes
CREATE INDEX IF NOT EXISTS "PhoneNumber_status_idx" ON "PhoneNumber"("status");
