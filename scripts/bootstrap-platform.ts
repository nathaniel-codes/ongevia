/**
 * Idempotent bootstrap: seed admin, wallet defaults, and platform IG from env.
 *
 * Env (on VPS in /etc/ongevia/.env):
 *   ADMIN_EMAIL, ADMIN_PASSWORD
 *   PLATFORM_IG_ACCESS_TOKEN, PLATFORM_IG_USER_ID
 *   PLATFORM_IG_USERNAME (default ongeviadotcom)
 *   CREDITS_PER_1000_TZS, DM_CREDIT_COST, SIGNUP_BONUS_CREDITS
 *
 * Wipe all app data first:
 *   WIPE_DB=1 npx tsx scripts/bootstrap-platform.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db/client";
import { encryptToken } from "../lib/meta/oauth";
import { ensureWorkspaceForUser } from "../lib/workspace";

async function wipeAllData() {
  console.log("[bootstrap] WIPE_DB=1 — truncating application tables…");
  // Order respects FKs; TRUNCATE CASCADE is safest for a clean slate.
  await prisma.$executeRawUnsafe(`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename NOT IN ('_prisma_migrations')
      ) LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `);
  console.log("[bootstrap] database wiped");
}

async function upsertSetting(key: string, value: string) {
  await prisma.platformSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@ongevia.local")
    .trim()
    .toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "OngeviaAdmin2026!";
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      isSuperAdmin: true,
      name: "Super Admin",
      emailVerified: new Date(),
    },
    update: {
      passwordHash,
      isSuperAdmin: true,
      isSuspended: false,
      emailVerified: new Date(),
    },
  });

  const workspace = await ensureWorkspaceForUser(user.id, email);
  console.log(`[bootstrap] admin: ${user.email} workspace=${workspace.id}`);
  return { user, workspace };
}

async function seedWalletDefaults() {
  const credits = process.env.CREDITS_PER_1000_TZS ?? "1000";
  const dmCost = process.env.DM_CREDIT_COST ?? "10";
  const bonus = process.env.SIGNUP_BONUS_CREDITS ?? "1000";
  await upsertSetting("CREDITS_PER_1000_TZS", credits);
  await upsertSetting("DM_CREDIT_COST", dmCost);
  await upsertSetting("SIGNUP_BONUS_CREDITS", bonus);
  console.log(
    `[bootstrap] wallet: ${credits} credits/1000 TZS, DM cost ${dmCost}, signup bonus ${bonus}`
  );
}

async function seedPlatformInstagram(workspaceId: string) {
  const token = (process.env.PLATFORM_IG_ACCESS_TOKEN ?? "").trim();
  const igUserId = (process.env.PLATFORM_IG_USER_ID ?? "").trim();
  const username = (
    process.env.PLATFORM_IG_USERNAME ??
    process.env.PLATFORM_INSTAGRAM_USERNAME ??
    "ongeviadotcom"
  )
    .trim()
    .replace(/^@/, "")
    .toLowerCase();

  if (!token || !igUserId) {
    console.warn(
      "[bootstrap] PLATFORM_IG_ACCESS_TOKEN / PLATFORM_IG_USER_ID missing — skip IG seed"
    );
    return;
  }

  // Only one platform-shared account
  await prisma.instagramAccount.updateMany({
    data: { isPlatformShared: false },
  });

  const encrypted = encryptToken(token);
  const account = await prisma.instagramAccount.upsert({
    where: { instagramId: igUserId },
    create: {
      workspaceId,
      instagramId: igUserId,
      username,
      name: username,
      accessToken: encrypted,
      webhookSubscribed: true,
      isPlatformShared: true,
    },
    update: {
      workspaceId,
      username,
      name: username,
      accessToken: encrypted,
      webhookSubscribed: true,
      isPlatformShared: true,
    },
  });

  console.log(
    `[bootstrap] platform IG @${account.username} (${account.instagramId}) shared=true`
  );
}

async function main() {
  if (process.env.WIPE_DB === "1") {
    await wipeAllData();
  }

  const { workspace } = await seedAdmin();
  await seedWalletDefaults();
  await seedPlatformInstagram(workspace.id);
  console.log("[bootstrap] done");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
