-- CreateEnum
CREATE TYPE "PostClaimStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'RELEASED');

-- CreateTable
CREATE TABLE "PostClaim" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "instagramAccountId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "postUrl" TEXT,
    "claimantIgUsername" TEXT NOT NULL,
    "claimantIgUserId" TEXT,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "status" "PostClaimStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostClaim_workspaceId_idx" ON "PostClaim"("workspaceId");

-- CreateIndex
CREATE INDEX "PostClaim_instagramAccountId_mediaId_idx" ON "PostClaim"("instagramAccountId", "mediaId");

-- CreateIndex
CREATE INDEX "PostClaim_status_idx" ON "PostClaim"("status");

-- One verified claim per platform media
CREATE UNIQUE INDEX "PostClaim_verified_media_unique"
ON "PostClaim"("instagramAccountId", "mediaId")
WHERE "status" = 'VERIFIED';

-- AddForeignKey
ALTER TABLE "PostClaim" ADD CONSTRAINT "PostClaim_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostClaim" ADD CONSTRAINT "PostClaim_instagramAccountId_fkey" FOREIGN KEY ("instagramAccountId") REFERENCES "InstagramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
