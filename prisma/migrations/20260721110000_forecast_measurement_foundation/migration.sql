CREATE TABLE "ForecastSnapshot" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "inputFingerprint" TEXT NOT NULL,
  "forecastStartDate" TIMESTAMP(3) NOT NULL,
  "forecastEndDate" TIMESTAMP(3) NOT NULL,
  "startingBalanceCents" INTEGER NOT NULL,
  "safetyBufferCents" INTEGER NOT NULL,
  "safeToSpendCents" INTEGER NOT NULL,
  "lowestBalanceCents" INTEGER NOT NULL,
  "lowestBalanceDate" TIMESTAMP(3) NOT NULL,
  "confirmedEventCount" INTEGER NOT NULL,
  "estimatedEventCount" INTEGER NOT NULL,
  "projectedDays" JSONB NOT NULL,
  "includedEvents" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ForecastSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActualBalanceObservation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "balanceCents" INTEGER NOT NULL,
  "observedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActualBalanceObservation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ForecastSnapshot_userId_inputFingerprint_key" ON "ForecastSnapshot"("userId", "inputFingerprint");
CREATE INDEX "ForecastSnapshot_userId_createdAt_idx" ON "ForecastSnapshot"("userId", "createdAt");
CREATE UNIQUE INDEX "ActualBalanceObservation_accountId_observedAt_key" ON "ActualBalanceObservation"("accountId", "observedAt");
CREATE INDEX "ActualBalanceObservation_userId_observedAt_idx" ON "ActualBalanceObservation"("userId", "observedAt");
ALTER TABLE "ActualBalanceObservation" ADD CONSTRAINT "ActualBalanceObservation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
