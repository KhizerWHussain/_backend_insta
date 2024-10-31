-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pronouns" TEXT;

-- CreateTable
CREATE TABLE "WebLink" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    "title" TEXT,
    "url" TEXT,
    "creatorId" INTEGER,

    CONSTRAINT "WebLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebLink_creatorId_key" ON "WebLink"("creatorId");

-- AddForeignKey
ALTER TABLE "WebLink" ADD CONSTRAINT "WebLink_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
