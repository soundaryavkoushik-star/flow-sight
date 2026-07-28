ALTER TABLE "CreditCardSettings"
  DROP CONSTRAINT "CreditCardSettings_paymentAccountId_fkey";

ALTER TABLE "CreditCardSettings"
  ALTER COLUMN "paymentAccountId" DROP NOT NULL;

ALTER TABLE "CreditCardSettings"
  ADD CONSTRAINT "CreditCardSettings_paymentAccountId_fkey"
  FOREIGN KEY ("paymentAccountId") REFERENCES "Account"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
