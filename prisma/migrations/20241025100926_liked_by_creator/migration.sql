/*
  Warnings:

  - You are about to drop the column `likedByMe` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `privacyType` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `likedByMe` on the `Reel` table. All the data in the column will be lost.
  - You are about to drop the column `likedByMe` on the `Story` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "likedByMe",
DROP COLUMN "privacyType",
ADD COLUMN     "likedByCreator" BOOLEAN;

-- AlterTable
ALTER TABLE "Reel" DROP COLUMN "likedByMe",
ADD COLUMN     "likedByCreator" BOOLEAN;

-- AlterTable
ALTER TABLE "Story" DROP COLUMN "likedByMe",
ADD COLUMN     "likedByCreator" BOOLEAN;

-- DropEnum
DROP TYPE "PostPrivacyType";
