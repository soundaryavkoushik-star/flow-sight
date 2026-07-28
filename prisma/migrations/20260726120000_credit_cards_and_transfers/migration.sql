CREATE TABLE "CreditCardSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "paymentAccountId" TEXT NOT NULL,
    "statementBalanceCents" INTEGER NOT NULL,
    "minimumPaymentCents" INTEGER,
    "statementClosingDay" INTEGER NOT NULL,
    "paymentDueDay" INTEGER NOT NULL,
    "paymentStrategy" TEXT NOT NULL DEFAULT 'full_statement',
    "fixedPaymentCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CreditCardSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TransactionTransfer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "outgoingTransactionId" TEXT NOT NULL,
    "incomingTransactionId" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'suggested',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TransactionTransfer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreditCardSettings_accountId_key" ON "CreditCardSettings"("accountId");
CREATE INDEX "CreditCardSettings_userId_idx" ON "CreditCardSettings"("userId");
CREATE INDEX "CreditCardSettings_paymentAccountId_idx" ON "CreditCardSettings"("paymentAccountId");
CREATE UNIQUE INDEX "TransactionTransfer_outgoingTransactionId_key" ON "TransactionTransfer"("outgoingTransactionId");
CREATE UNIQUE INDEX "TransactionTransfer_incomingTransactionId_key" ON "TransactionTransfer"("incomingTransactionId");
CREATE UNIQUE INDEX "TransactionTransfer_outgoingTransactionId_incomingTransactionId_key" ON "TransactionTransfer"("outgoingTransactionId", "incomingTransactionId");
CREATE INDEX "TransactionTransfer_userId_status_idx" ON "TransactionTransfer"("userId", "status");

ALTER TABLE "CreditCardSettings" ADD CONSTRAINT "CreditCardSettings_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreditCardSettings" ADD CONSTRAINT "CreditCardSettings_paymentAccountId_fkey" FOREIGN KEY ("paymentAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TransactionTransfer" ADD CONSTRAINT "TransactionTransfer_outgoingTransactionId_fkey" FOREIGN KEY ("outgoingTransactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TransactionTransfer" ADD CONSTRAINT "TransactionTransfer_incomingTransactionId_fkey" FOREIGN KEY ("incomingTransactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
