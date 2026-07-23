ALTER TABLE "UserProfile" ADD COLUMN "incomePattern" TEXT NOT NULL DEFAULT 'regular';

ALTER TABLE "RecurringSeries"
  ADD COLUMN "earliestExpected" TIMESTAMP(3),
  ADD COLUMN "latestExpected" TIMESTAMP(3),
  ADD COLUMN "incomeConfidence" TEXT;
