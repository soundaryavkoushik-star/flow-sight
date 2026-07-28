ALTER TABLE "UserProfile"
ADD COLUMN "lastForecastAccountIds" JSONB NOT NULL DEFAULT '[]';
