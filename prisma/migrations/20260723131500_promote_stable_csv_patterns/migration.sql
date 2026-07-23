UPDATE "RecurringSeries"
SET "dateConfidence" = 'confirmed'
WHERE "status" = 'confirmed'
  AND "normalizedKey" LIKE 'csv:%'
  AND "minAmountCents" IS NOT NULL
  AND "maxAmountCents" IS NOT NULL
  AND ABS("maxAmountCents" - "minAmountCents")
      <= GREATEST(
        1,
        ROUND(
          ((ABS("minAmountCents") + ABS("maxAmountCents")) / 2.0) * 0.01
        )
      );
