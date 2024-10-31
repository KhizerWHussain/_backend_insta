/*
  Warnings:

  - You are about to drop the column `profileMusicId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_profileMusicId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "profileMusicId";

-- CreateTable
CREATE TABLE "Notes" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    "noteImageMediaId" INTEGER,
    "noteMusicId" INTEGER,
    "creatorId" INTEGER,

    CONSTRAINT "Notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Notes_creatorId_key" ON "Notes"("creatorId");

-- AddForeignKey
ALTER TABLE "Notes" ADD CONSTRAINT "Notes_noteImageMediaId_fkey" FOREIGN KEY ("noteImageMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notes" ADD CONSTRAINT "Notes_noteMusicId_fkey" FOREIGN KEY ("noteMusicId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notes" ADD CONSTRAINT "Notes_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
