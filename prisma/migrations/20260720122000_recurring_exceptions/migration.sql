CREATE TABLE "RecurringException" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "recurringSeriesId" TEXT NOT NULL,
  "originalDate" TIMESTAMP(3) NOT NULL,
  "action" TEXT NOT NULL,
  "movedDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecurringException_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecurringException_recurringSeriesId_originalDate_key" ON "RecurringException"("recurringSeriesId", "originalDate");
CREATE INDEX "RecurringException_userId_idx" ON "RecurringException"("userId");
ALTER TABLE "RecurringException" ADD CONSTRAINT "RecurringException_recurringSeriesId_fkey" FOREIGN KEY ("recurringSeriesId") REFERENCES "RecurringSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
