-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "userFollowId" INTEGER;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userFollowId_fkey" FOREIGN KEY ("userFollowId") REFERENCES "UserFollow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
