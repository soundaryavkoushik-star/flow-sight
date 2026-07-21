ALTER TABLE "UserProfile" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC';

ALTER TABLE "RecurringSeries"
ADD COLUMN "anchorDayOfMonth" INTEGER,
ADD COLUMN "minAmountCents" INTEGER,
ADD COLUMN "maxAmountCents" INTEGER,
ADD COLUMN "occurrenceCount" INTEGER,
ADD COLUMN "evidenceStartDate" TIMESTAMP(3),
ADD COLUMN "evidenceEndDate" TIMESTAMP(3);

UPDATE "RecurringSeries"
SET "anchorDayOfMonth" = EXTRACT(DAY FROM "nextExpected")::INTEGER
WHERE "frequency" IN ('monthly', 'annual') AND "nextExpected" IS NOT NULL;
