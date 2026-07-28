UPDATE "RecurringSeries"
SET "frequency" = 'monthly'
WHERE "normalizedKey" LIKE 'onboarding:income:%'
  AND "frequency" = 'irregular'
  AND "incomeConfidence" IS NOT NULL;
