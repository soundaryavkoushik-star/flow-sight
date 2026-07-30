ALTER TABLE "UserProfile"
ADD COLUMN "safetyBufferConfiguredAt" TIMESTAMP(3),
ADD COLUMN "safetyBufferPromptDismissedAt" TIMESTAMP(3);

-- Existing manual-onboarding users explicitly completed the buffer step.
-- Existing users with a positive buffer also made an explicit choice.
UPDATE "UserProfile"
SET "safetyBufferConfiguredAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP)
WHERE "safetyBufferCents" > 0
   OR "incomePatternSource" = 'onboarding';
