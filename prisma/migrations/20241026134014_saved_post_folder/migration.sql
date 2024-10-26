/*
  Warnings:

  - Added the required column `folderId` to the `SavedPost` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SavedPost" ADD COLUMN     "folderId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "savedPostFolder" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    "creatorId" INTEGER NOT NULL,

    CONSTRAINT "savedPostFolder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SavedPost" ADD CONSTRAINT "SavedPost_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "savedPostFolder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savedPostFolder" ADD CONSTRAINT "savedPostFolder_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
