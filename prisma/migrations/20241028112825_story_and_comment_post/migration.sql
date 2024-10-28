/*
  Warnings:

  - You are about to drop the column `content` on the `Reel` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `likedByCreator` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `mediaId` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `privacyType` on the `Story` table. All the data in the column will be lost.
  - Added the required column `mediaType` to the `Story` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Story" DROP CONSTRAINT "Story_mediaId_fkey";

-- DropIndex
DROP INDEX "Story_mediaId_key";

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "storyId" INTEGER;

-- AlterTable
ALTER TABLE "Reel" DROP COLUMN "content";

-- AlterTable
ALTER TABLE "Story" DROP COLUMN "content",
DROP COLUMN "likedByCreator",
DROP COLUMN "mediaId",
DROP COLUMN "privacyType",
ADD COLUMN     "AudienceType" "AudienceType" DEFAULT 'EVERYONE',
ADD COLUMN     "caption" TEXT,
ADD COLUMN     "collage" BOOLEAN DEFAULT false,
ADD COLUMN     "mediaType" "MediaType" NOT NULL,
ADD COLUMN     "seenByCreator" BOOLEAN DEFAULT false;

-- CreateTable
CREATE TABLE "StoryView" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,
    "storyId" INTEGER NOT NULL,
    "viewerId" INTEGER NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commentPost" (
    "id" SERIAL NOT NULL,
    "comment" TEXT NOT NULL,
    "commentatorId" INTEGER NOT NULL,
    "postId" INTEGER NOT NULL,
    "parentCommentId" INTEGER,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,
    "likedBy" INTEGER[] DEFAULT ARRAY[]::INTEGER[],

    CONSTRAINT "commentPost_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryView" ADD CONSTRAINT "StoryView_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryView" ADD CONSTRAINT "StoryView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentPost" ADD CONSTRAINT "commentPost_commentatorId_fkey" FOREIGN KEY ("commentatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentPost" ADD CONSTRAINT "commentPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentPost" ADD CONSTRAINT "commentPost_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "commentPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;
