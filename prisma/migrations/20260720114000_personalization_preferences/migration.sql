ALTER TABLE "UserProfile"
ADD COLUMN "alertSafetyBuffer" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "alertKnownBill" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "alertEstimateReview" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "alertStaleBalance" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "alertLeadDays" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN "dashboardEmphasis" TEXT NOT NULL DEFAULT 'status',
ADD COLUMN "dashboardDensity" TEXT NOT NULL DEFAULT 'comfortable',
ADD COLUMN "showSpendingHistory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lastForecastViewedAt" TIMESTAMP(3),
ADD COLUMN "lastSafeToSpendCents" INTEGER,
ADD COLUMN "lastLowestBalanceCents" INTEGER;
