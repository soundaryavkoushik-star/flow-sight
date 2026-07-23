ALTER TABLE "UserProfile"
ADD COLUMN "incomePatternSource" TEXT NOT NULL DEFAULT 'onboarding',
ADD COLUMN "incomePatternUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "RecurringSeries"
ADD COLUMN "reconciliationId" TEXT,
ADD COLUMN "replacedAt" TIMESTAMP(3),
ADD COLUMN "replacedByImport" TEXT,
ADD COLUMN "replacementNote" TEXT;

CREATE INDEX "RecurringSeries_userId_reconciliationId_idx"
ON "RecurringSeries"("userId", "reconciliationId");
