-- Prisma client casts wallet/payment/action fields to enums, but the original
-- Ongevia migration created TEXT columns. Create the missing enum types and
-- convert columns so signup/login (wallet bonus + action logs) works.
DO $$ BEGIN
  CREATE TYPE "WalletTransactionType" AS ENUM ('TOP_UP', 'DM_SPEND', 'ADMIN_GRANT', 'ADMIN_DEBIT', 'REFUND');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentOrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ActionActorType" AS ENUM ('USER', 'ADMIN', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "WalletTransaction"
    ALTER COLUMN "type" TYPE "WalletTransactionType"
    USING "type"::text::"WalletTransactionType";
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "PaymentOrder" ALTER COLUMN "status" DROP DEFAULT;
  ALTER TABLE "PaymentOrder"
    ALTER COLUMN "status" TYPE "PaymentOrderStatus"
    USING "status"::text::"PaymentOrderStatus";
  ALTER TABLE "PaymentOrder"
    ALTER COLUMN "status" SET DEFAULT 'PENDING'::"PaymentOrderStatus";
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "ActionLog" ALTER COLUMN "actorType" DROP DEFAULT;
  ALTER TABLE "ActionLog"
    ALTER COLUMN "actorType" TYPE "ActionActorType"
    USING "actorType"::text::"ActionActorType";
  ALTER TABLE "ActionLog"
    ALTER COLUMN "actorType" SET DEFAULT 'USER'::"ActionActorType";
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE "OperationalEventSource" ADD VALUE IF NOT EXISTS 'PAYMENT';
EXCEPTION WHEN others THEN null; END $$;
