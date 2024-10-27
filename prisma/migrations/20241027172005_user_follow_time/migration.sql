-- DropIndex
DROP INDEX "UserFollow_followerId_followingId_key";

-- AlterTable
ALTER TABLE "UserFollow" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMPTZ;
