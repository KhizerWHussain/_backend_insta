/*
  Warnings:

  - A unique constraint covering the columns `[savedByUserId,postId,folderId]` on the table `SavedPost` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "SavedPost_savedByUserId_postId_key";

-- CreateIndex
CREATE UNIQUE INDEX "SavedPost_savedByUserId_postId_folderId_key" ON "SavedPost"("savedByUserId", "postId", "folderId");
