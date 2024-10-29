/*
  Warnings:

  - You are about to drop the column `likedByCreator` on the `Reel` table. All the data in the column will be lost.
  - You are about to drop the column `mediaId` on the `Reel` table. All the data in the column will be lost.
  - You are about to drop the column `privacyType` on the `Reel` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "UserActiveStatus" AS ENUM ('ACTIVE', 'DEACTIVATED');

-- DropForeignKey
ALTER TABLE "Reel" DROP CONSTRAINT "Reel_mediaId_fkey";

-- DropIndex
DROP INDEX "Reel_mediaId_key";

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "reelid" INTEGER;

-- AlterTable
ALTER TABLE "Reel" DROP COLUMN "likedByCreator",
DROP COLUMN "mediaId",
DROP COLUMN "privacyType",
ADD COLUMN     "caption" TEXT,
ADD COLUMN     "musicId" INTEGER,
ADD COLUMN     "seenByCreator" BOOLEAN;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeStatus" "UserActiveStatus" DEFAULT 'ACTIVE';

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_reelid_fkey" FOREIGN KEY ("reelid") REFERENCES "Reel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reel" ADD CONSTRAINT "Reel_musicId_fkey" FOREIGN KEY ("musicId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
