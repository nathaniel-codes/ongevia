-- Ongevia: phone auth, wallets, payments, action logs, admin
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerified" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");

ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "impersonatedByUserId" TEXT;
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Session_impersonatedByUserId_idx" ON "Session"("impersonatedByUserId");

-- Replace invitation email with phone
ALTER TABLE "WorkspaceInvitation" ADD COLUMN IF NOT EXISTS "phone" TEXT;
UPDATE "WorkspaceInvitation" SET "phone" = COALESCE("phone", "email") WHERE "phone" IS NULL;
ALTER TABLE "WorkspaceInvitation" ALTER COLUMN "phone" SET NOT NULL;
DROP INDEX IF EXISTS "WorkspaceInvitation_workspaceId_email_key";
DROP INDEX IF EXISTS "WorkspaceInvitation_email_idx";
ALTER TABLE "WorkspaceInvitation" DROP COLUMN IF EXISTS "email";
CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceInvitation_workspaceId_phone_key" ON "WorkspaceInvitation"("workspaceId", "phone");
CREATE INDEX IF NOT EXISTS "WorkspaceInvitation_phone_idx" ON "WorkspaceInvitation"("phone");

CREATE TABLE IF NOT EXISTS "PhoneOtp" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PhoneOtp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PhoneOtp_phone_createdAt_idx" ON "PhoneOtp"("phone", "createdAt");
CREATE INDEX IF NOT EXISTS "PhoneOtp_expiresAt_idx" ON "PhoneOtp"("expiresAt");

CREATE TABLE IF NOT EXISTS "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Wallet_userId_key" ON "Wallet"("userId");

CREATE TABLE IF NOT EXISTS "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WalletTransaction_walletId_createdAt_idx" ON "WalletTransaction"("walletId", "createdAt");
CREATE INDEX IF NOT EXISTS "WalletTransaction_type_idx" ON "WalletTransaction"("type");

CREATE TABLE IF NOT EXISTS "PaymentOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amountTzs" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "pushResponse" JSONB,
    "pollResponse" JSONB,
    "paidAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentOrder_orderId_key" ON "PaymentOrder"("orderId");
CREATE INDEX IF NOT EXISTS "PaymentOrder_userId_createdAt_idx" ON "PaymentOrder"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "PaymentOrder_status_idx" ON "PaymentOrder"("status");

CREATE TABLE IF NOT EXISTS "ActionLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "impersonatedUserId" TEXT,
    "actorType" TEXT NOT NULL DEFAULT 'USER',
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "workspaceId" TEXT,
    "ip" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActionLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ActionLog_createdAt_idx" ON "ActionLog"("createdAt");
CREATE INDEX IF NOT EXISTS "ActionLog_actorUserId_idx" ON "ActionLog"("actorUserId");
CREATE INDEX IF NOT EXISTS "ActionLog_action_idx" ON "ActionLog"("action");
CREATE INDEX IF NOT EXISTS "ActionLog_workspaceId_idx" ON "ActionLog"("workspaceId");
CREATE INDEX IF NOT EXISTS "ActionLog_entityType_entityId_idx" ON "ActionLog"("entityType", "entityId");

CREATE TABLE IF NOT EXISTS "PlatformSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PlatformSetting_key_key" ON "PlatformSetting"("key");

DO $$ BEGIN
  ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_impersonatedUserId_fkey" FOREIGN KEY ("impersonatedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
