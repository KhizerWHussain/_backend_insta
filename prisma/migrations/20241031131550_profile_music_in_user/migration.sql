-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileMusicId" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_profileMusicId_fkey" FOREIGN KEY ("profileMusicId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
