-- Display-name lookup key (case-insensitive). Not unique at DB level so a
-- paid name-share can allow the same name on two accounts.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nameKey" TEXT;
CREATE INDEX IF NOT EXISTS "User_nameKey_idx" ON "User"("nameKey");
