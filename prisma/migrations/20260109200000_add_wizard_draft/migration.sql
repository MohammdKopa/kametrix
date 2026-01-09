-- CreateEnum: WizardDraftStatus for tracking wizard draft lifecycle
CREATE TYPE "WizardDraftStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PUBLISHED', 'ABANDONED');

-- CreateTable: WizardDraft for auto-saving wizard state
CREATE TABLE "WizardDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "WizardDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "wizardState" JSONB NOT NULL,
    "lastSavedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agentId" TEXT,

    CONSTRAINT "WizardDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique constraint on userId and status (one active draft per user)
CREATE UNIQUE INDEX "WizardDraft_userId_status_key" ON "WizardDraft"("userId", "status");

-- CreateIndex: Unique constraint on agentId (one draft per agent)
CREATE UNIQUE INDEX "WizardDraft_agentId_key" ON "WizardDraft"("agentId");

-- CreateIndex: Index on userId for faster user draft queries
CREATE INDEX "WizardDraft_userId_idx" ON "WizardDraft"("userId");

-- CreateIndex: Index on status for faster status queries
CREATE INDEX "WizardDraft_status_idx" ON "WizardDraft"("status");

-- CreateIndex: Index on createdAt for sorting by creation date
CREATE INDEX "WizardDraft_createdAt_idx" ON "WizardDraft"("createdAt" DESC);

-- CreateIndex: Index on lastSavedAt for sorting by last save time
CREATE INDEX "WizardDraft_lastSavedAt_idx" ON "WizardDraft"("lastSavedAt" DESC);

-- AddForeignKey: Link WizardDraft to User
ALTER TABLE "WizardDraft" ADD CONSTRAINT "WizardDraft_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Link WizardDraft to Agent (optional, set null if agent deleted)
ALTER TABLE "WizardDraft" ADD CONSTRAINT "WizardDraft_agentId_fkey"
    FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
