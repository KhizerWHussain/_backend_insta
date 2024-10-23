/*
  Warnings:

  - Added the required column `driveId` to the `Media` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "driveId" TEXT NOT NULL;
