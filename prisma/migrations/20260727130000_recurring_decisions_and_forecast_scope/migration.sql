ALTER TABLE "ForecastSnapshot"
  ADD COLUMN "includedAccountIds" JSONB NOT NULL DEFAULT '[]';

CREATE TABLE "RecurringSuggestionDecision" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "normalizedKey" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RecurringSuggestionDecision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecurringSuggestionDecision_userId_accountId_normalizedKey_key"
  ON "RecurringSuggestionDecision"("userId", "accountId", "normalizedKey");

CREATE INDEX "RecurringSuggestionDecision_userId_decision_idx"
  ON "RecurringSuggestionDecision"("userId", "decision");
