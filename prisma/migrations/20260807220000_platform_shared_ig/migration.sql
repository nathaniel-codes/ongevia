-- Platform-shared Instagram account (Ongevia collaborate page)
ALTER TABLE "InstagramAccount" ADD COLUMN IF NOT EXISTS "isPlatformShared" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "InstagramAccount_isPlatformShared_idx" ON "InstagramAccount"("isPlatformShared");
